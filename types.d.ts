import React from 'react';
export declare type Subscriber = (value: any) => void;
export declare type Observable = {
    value: any;
    subscribe: (listener: Subscriber) => () => void;
};
export declare type GetterFunction = (state: any) => any;
export declare type MutationFunction = (state: any, payload?: any) => void;
export declare type GetterDescription = {
    module: string;
    func: GetterFunction;
};
export declare type MutationDescription = {
    module: string;
    func: MutationFunction;
};
export declare type GetterHook = () => any;
export interface StoreDescriptor {
    state: any;
    mutations?: Record<string, MutationFunction>;
    getters?: Record<string, GetterFunction>;
    modules?: Record<string, StoreDescriptor>;
}
export interface ReaxInstance {
    $$instance: Observable;
    state: any;
    commit: (type: string, payload: any) => void;
    subscribe: (listener: Subscriber) => () => void;
    registerModule: (name: string, descriptor: StoreDescriptor) => void;
    unregisterModule: (name: string) => void;
    rawGetters: Record<string, GetterDescription>;
}
export interface ReaxInstanceForFunctional extends ReaxInstance {
    getters: Record<string, GetterHook>;
    $$rebuildGetters: () => void;
}
export interface ReaxInstanceForClasses extends ReaxInstance {
    connectGettersToState: (ctx: React.Component, getter: string | string[]) => void;
}
