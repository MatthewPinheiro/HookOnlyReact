type MattactComponent = (props: Record<string, any>) => [MattactComponent, Record<string, any>] | [];
type MattactReturn = ReturnType<MattactComponent>;


const { useState, render, useEffect } = (() => {
    type ComponentTracker = {
        fn: MattactComponent;
        props: Record<string, any>,
        hooks: any[];
        index: number;
    }

    let CURRENT_COMPONENT: ComponentTracker;
    const NEXT_COMPONENTS = new Map<MattactComponent, ComponentTracker>();
    const EFFECTS_TO_RUN: ([ComponentTracker, () => void])[] = [];


    let myChildTracker: ComponentTracker;
    function useEffect(fn: () => void, deps?: any[]) {
        const currentComponent = CURRENT_COMPONENT;
        const prevDeps: any[] | undefined = currentComponent.hooks[currentComponent.index];

        const shouldRun = prevDeps && deps
            ? prevDeps.some((_, i) => prevDeps[i] !== deps[i])
            : true;

        if (currentComponent.fn == MyChildComponent as any) {
            if (myChildTracker !== currentComponent) console.log("NO MATCH!!!");
            console.log(shouldRun, EFFECTS_TO_RUN.length, currentComponent);
            myChildTracker = currentComponent;
        }
        if (shouldRun) {
            EFFECTS_TO_RUN.push([currentComponent, fn]);
        }
        if (currentComponent.index >= currentComponent.hooks.length) {
            currentComponent.hooks.push(deps);
        } else {
            currentComponent.hooks[currentComponent.index] = deps;
        }

        currentComponent.index++;
    }


    function useState<T>(initialVal: T): [T, (toUpdate: T) => void] {
        const currentComponent = CURRENT_COMPONENT;
        if (currentComponent.index >= currentComponent.hooks.length) {
            const stateArr: [T, (toUpdate: T) => void] = [initialVal, (toUpdate: T) => {
                const valAtThisTime = stateArr[0];
                if (valAtThisTime !== toUpdate) {
                    stateArr[0] = toUpdate;
                    NEXT_COMPONENTS.set(currentComponent.fn, currentComponent);
                }
            }];
            currentComponent.hooks.push(stateArr);
        }

        const stateArr = currentComponent.hooks[currentComponent.index];
        currentComponent.index++;

        return stateArr;
    }


    function initialRender(initial: MattactComponent) {
        CURRENT_COMPONENT = {
            fn: initial,
            props: {},
            hooks: [],
            index: 0
        };

        NEXT_COMPONENTS.set(CURRENT_COMPONENT.fn, CURRENT_COMPONENT);
        _render();
    }

    function _render() {
        for (const [component, tracker] of NEXT_COMPONENTS) {
            NEXT_COMPONENTS.delete(component);
            CURRENT_COMPONENT = tracker;

            tracker.index = 0;
            const [componentToRegister, propsToAdd] = component(tracker.props);

            if (componentToRegister && propsToAdd) {
                const trackerToAdd = component === componentToRegister
                    ? tracker
                    : NEXT_COMPONENTS.get(componentToRegister) || {
                        hooks: [],
                        fn: componentToRegister,
                        props: propsToAdd,
                        index: 0
                    };

                NEXT_COMPONENTS.set(componentToRegister, trackerToAdd);
            }
        }

        // if (EFFECTS_TO_RUN.length) setImmediate(_render);

        while (EFFECTS_TO_RUN.length) {
            const [component, effect] = EFFECTS_TO_RUN[0];
            CURRENT_COMPONENT = component;
            effect();
            EFFECTS_TO_RUN.shift();
        }

        setImmediate(_render);
    }

    return { useState, render: initialRender, useEffect };
})();






function MyParentComponent() {
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




function MyChildComponent() {
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


render(MyParentComponent as any);