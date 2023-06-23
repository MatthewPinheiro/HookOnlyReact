import * as React from "./lib";
import { render, useState, useEffect } from './lib';



function MyParentComponent() {
    const data = useMyCustomAsyncHook();
    const [count, setCount] = useState(0);

    console.log("Rendering MyParentComponent:",
        "\n\tcount -", count,
        "\n\tdata -", data
    );

    useEffect(() => {
        console.log("MyParentComponent useEffect (until count is 3)");
        if (count < 3) setCount(count + 1);
    }, [count]);

    return <MyChildComponent x={count}/>;
}



function MyChildComponent({ x }: { x: number }) {
    console.log("Rendering MyChildComponent with x =", x);

    useEffect(() => {
        console.log("MyChildComponent useEffect (one time)");
    }, []);

    return <></>;
}



function useMyCustomAsyncHook() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        console.log("useSomeAsyncData useEffect (one time)");
        setTimeout(() => setData({ some: "data" }), 1000);
    }, []);

    return data;
}




render(MyParentComponent);