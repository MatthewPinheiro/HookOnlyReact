const RENDER_QUEUE = new Set<ComponentTreeNode>();
const EFFECTS_QUEUE: [ComponentTreeNode, () => void][] = [];
let CURRENT_COMPONENT: ComponentTreeNode;
let CURRENT_HOOK_INDEX: number;



export type Component = (props: any) => [Component, Record<string, any>] | [];

export type ComponentTreeNode = {
    fn: Component;
    props: Record<string, any>;
    hooks: any[];
    child?: ComponentTreeNode | undefined;
};

export type UseStateArr<T> = [T, (toUpdate: T) => void];


function _recursivelyRender(treeNode: ComponentTreeNode) {
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







export function useEffect(fn: () => void, deps?: any[]) {
    const currentComponent = CURRENT_COMPONENT;
    const prevDeps: any[] | undefined = currentComponent.hooks[CURRENT_HOOK_INDEX];

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



export function useState<T>(initialVal: T): UseStateArr<T> {
    const currentComponent = CURRENT_COMPONENT;
    if (CURRENT_HOOK_INDEX >= currentComponent.hooks.length) {
        const stateArr: UseStateArr<T> = [initialVal, (toUpdate) => {
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



export function render(initial?: Function) {
    if (initial) {
        RENDER_QUEUE.add({ fn: initial as Component, props: {}, hooks: [] });
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



export function createElement(fn: Component | null, props: any): ReturnType<Component>  {
    return fn && props
        ? [fn, props]
        : [];
}

export const Fragment = null;