type Component = (props: Record<string, any>) => [Component, Record<string, any>] | [];
type ComponentReturn = ReturnType<Component>;


const { useState, render, useEffect } = (() => {
    type ComponentTreeNode = {
        fn: Component;
        props: Record<string, any>,
        hooks: any[];
        child?: ComponentTreeNode;
    }

    const RENDER_QUEUE = new Set<ComponentTreeNode>();
    const EFFECTS_QUEUE: ([ComponentTreeNode, () => void])[] = [];
    let CURRENT_COMPONENT: ComponentTreeNode;
    let CURRENT_HOOK_INDEX: number;


    function useEffect(fn: () => void, deps?: any[]) {
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


    function useState<T>(initialVal: T): [T, (toUpdate: T) => void] {
        const currentComponent = CURRENT_COMPONENT;
        if (CURRENT_HOOK_INDEX >= currentComponent.hooks.length) {
            const stateArr: [T, (toUpdate: T) => void] = [initialVal, (toUpdate: T) => {
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


    function render(initial?: Component) {
        if (initial) {
            RENDER_QUEUE.add({ fn: initial, props: {}, hooks: [] });
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

        setImmediate(render).unref();
    }

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


    return { render, useState, useEffect };
})();






function MyParentComponent(): ComponentReturn {
    const data = useSomeAsyncData(1000);
    const [count, setCount] = useState(0);

    console.log("Rendering MyParentComponent:",
        "\n\tcount -", count,
        "\n\tdata -", data
    );

    useEffect(() => {
        console.log("MyParentComponent useEffect");
        setCount(1);
    }, []);

    return [MyChildComponent, {}];
}




function MyChildComponent(): ComponentReturn {
    console.log("Rendering MyChildComponent");

    useEffect(() => {
        console.log("MyChildComponent useEffect");
    }, []);

    return [];
}


function useSomeAsyncData(timeToWait: number) {
    const [data, setData] = useState<null | Record<string, any>>(null);

    useEffect(() => {
        console.log("useSomeAsyncData useEffect");
        setTimeout(setData, timeToWait, { some: "data" });
    }, []);

    return data;
}


render(MyParentComponent);