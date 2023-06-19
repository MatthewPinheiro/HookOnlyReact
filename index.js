/** @typedef {(props: Record<string, any>) => [Component, Record<string, any>] | []} Component */

/** 
 * @typedef {{
 *  fn: Component;
 *  props: Record<string, any>,
 *  hooks: any[];
 *  child?: ComponentTreeNode;
 * }} ComponentTreeNode
 * */

/**
 * @template T
 * @typedef {[T, (toUpdate: T) => void]} UseStateArr
 */



const RENDER_QUEUE = /** @type {Set<ComponentTreeNode>} */ (new Set());
const EFFECTS_QUEUE = /** @type {([ComponentTreeNode, () => void])[]} */ ([]);

/** @type {ComponentTreeNode} */
let CURRENT_COMPONENT;
/** @type {number} */
let CURRENT_HOOK_INDEX;



/**
 * @param {ComponentTreeNode} treeNode
 */
function _recursivelyRender(treeNode) {
    RENDER_QUEUE.delete(treeNode);
    CURRENT_COMPONENT = treeNode;
    CURRENT_HOOK_INDEX = 0;

    const [currChildComp, props] = treeNode.fn(treeNode.props);
    const prevChildComp = treeNode.child?.fn;

    if (treeNode.child && Object.is(currChildComp, prevChildComp)) {
        treeNode.child.props = props || {};
    } else if (currChildComp) {
        treeNode.child = {
            fn: currChildComp,
            props: props || {},
            hooks: [],
        };
    }

    if (treeNode.child) {
        _recursivelyRender(treeNode.child);
    }
}









/**
 * 
 * @param {() => void} fn 
 * @param {any[]} [deps]
 */
exports.useEffect = function(fn, deps) {
    const currentComponent = CURRENT_COMPONENT;
    /** @type {any[] | undefined} */
    const prevDeps = currentComponent.hooks[CURRENT_HOOK_INDEX];

    const shouldRun = prevDeps && deps
        ? prevDeps.some((_, i) => prevDeps[i] !== deps[i])
        : true;

    if (shouldRun) {
        EFFECTS_QUEUE.push([currentComponent, fn]);
    }
    if (CURRENT_HOOK_INDEX >= currentComponent.hooks.length) {
        currentComponent.hooks.push(deps);
    } else {
        currentComponent.hooks[CURRENT_HOOK_INDEX] = deps;
    }

    CURRENT_HOOK_INDEX++;
}



/**
 * @template T
 * @param {T} initialVal 
 * @returns {UseStateArr<T>}
 */
exports.useState = function useState(initialVal) {
    const currentComponent = CURRENT_COMPONENT;
    if (CURRENT_HOOK_INDEX >= currentComponent.hooks.length) {
        /** @type {UseStateArr<T>} */
        const stateArr = [initialVal, (toUpdate) => {
            const valAtThisTime = stateArr[0];
            if (valAtThisTime !== toUpdate) {
                stateArr[0] = toUpdate;
                RENDER_QUEUE.add(currentComponent);
            }
        }];
        currentComponent.hooks.push(stateArr);
    }

    const stateArr = currentComponent.hooks[CURRENT_HOOK_INDEX];
    CURRENT_HOOK_INDEX++;

    return stateArr;
}



/**
 * 
 * @param {Function} [initial]
 */
exports.render = function render(initial) {
    if (initial) {
        RENDER_QUEUE.add({ fn: /** @type {Component} */ (initial), props: {}, hooks: [] });
    }

    for (const node of RENDER_QUEUE) {
        _recursivelyRender(node);
    }

    while (EFFECTS_QUEUE.length) {
        const [component, effect] = EFFECTS_QUEUE[0];
        CURRENT_COMPONENT = component;
        effect();
        EFFECTS_QUEUE.shift();
    }

    // @ts-ignore
    setImmediate(render).unref();
}