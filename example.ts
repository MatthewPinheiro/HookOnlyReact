import { render, useState, useEffect } from "./index";



function MyParentComponent() {
    const data = useMyCustomAsyncHook();
    const [count, setCount] = useState(0);

    console.log("Rendering MyParentComponent:",
        "\n\tcount -", count,
        "\n\tdata -", data
    );

    useEffect(() => {
        console.log("MyParentComponent useEffect (one time render)");
        setCount(1);
    }, []);

    useEffect(() => {
        console.log("MyParentComponent useEffect (every render)");
    });

    return [MyChildComponent, {}];
    // return (<MyChildComponent/>);
}



function MyChildComponent() {
    console.log("Rendering MyChildComponent");

    useEffect(() => {
        console.log("MyChildComponent useEffect");
    }, []);

    return [];
    // return (<></>);
}



function useMyCustomAsyncHook() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        console.log("useSomeAsyncData useEffect");
        setTimeout(() => setData({ some: "data" }), 1000);
    }, []);

    return data;
}




render(MyParentComponent);