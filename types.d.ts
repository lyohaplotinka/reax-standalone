import React from 'react';
export declare type Subscriber = (value: any) => void;
export declare type Observable = {
    value: any;
    subscribe: (listener: Subscriber) => () => void;
};
export declare type GetterFunction = (state: any, getters?: any) => any;
export declare type MutationFunction = (state: any, payload?: any) => void;
export declare type GetterDescription = {
    module: string;
    func: GetterFunction;
};
export declare type MutationDescription = {
    module: string;
    func: MutationFunction;
};
export declare type ActionFunction = (context: ReaxContext, payload: any) => void | Promise<void>;
export declare type GetterHook = () => any;
export interface StoreDescriptor {
    state: any;
    mutations?: Record<string, MutationFunction>;
    getters?: Record<string, GetterFunction>;
    modules?: Record<string, StoreDescriptor>;
    actions?: Record<string, ActionFunction>;
}
export interface ReaxContext {
    commit: (type: string, payload: any) => void;
    getters: Record<string, () => any>;
    dispatch: (type: string, payload: any) => void | Promise<void>;
}
export interface ReaxInstance {
    state: any;
    commit: (type: string, payload: any) => void;
    dispatch: (type: string, payload: any) => void | Promise<void>;
    registerModule: (name: string, descriptor: StoreDescriptor) => void;
    unregisterModule: (name: string) => void;
    $$instance: Observable;
    $$subscribe: (listener: Subscriber) => () => void;
    $$getterFunctions: Record<string, () => any>;
    $$selfUpdate: () => void;
}
export interface ReaxInstanceForFunctional extends ReaxInstance {
    getters: Record<string, GetterHook>;
    $$rebuildGetters: () => void;
}
export interface ReaxInstanceForClasses extends ReaxInstance {
    connectGettersToState: (ctx: React.Component, getter: string | string[]) => void;
}
export interface ReaxInstanceForAll extends ReaxInstance {
    getters: Record<string, GetterHook>;
    $$rebuildGetters: () => void;
    connectGettersToState: (ctx: React.Component, getter: string | string[]) => void;
}
