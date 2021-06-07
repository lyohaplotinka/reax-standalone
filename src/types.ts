export type Subscriber = (value: any) => void;

export type Observable = {
  value: any;
  subscribe: (listener: Subscriber) => () => void;
};

export type GetterFunction = (state: any) => any;

export type MutationFunction = (state: any, payload?: any) => void;

export type GetterDescription = { module: string; func: GetterFunction };

export type MutationDescription = { module: string; func: MutationFunction };

export interface StoreDescriptor {
  state: any;
  mutations?: Record<string, MutationFunction>;
  getters?: Record<string, GetterFunction>;
  modules?: Record<string, StoreDescriptor>;
}
