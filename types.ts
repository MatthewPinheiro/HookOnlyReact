export type Component = (props: Record<string, any>) => [Component, Record<string, any>] | [];

export type ComponentTreeNode = {
    fn: Component;
    props: Record<string, any>;
    hooks: any[];
    child?: ComponentTreeNode | undefined;
};

export type UseStateArr<T> = [T, (toUpdate: T) => void];