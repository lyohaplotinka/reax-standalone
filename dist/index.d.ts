import { StoreDescriptor, Subscriber } from "./types";
export declare function createStore(descriptor: StoreDescriptor): {
    readonly state: any;
    commit: (type: string, payload: any) => void;
    getters: any;
    subscribe: (listener: Subscriber) => () => void;
    registerModule: (name: string, descriptor: StoreDescriptor) => void;
    unregisterModule: (name: string) => void;
};
