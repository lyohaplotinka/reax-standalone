import React from 'react';

export type Subscriber = (value: unknown) => void;

export type State = Record<string, unknown>;

export type GetterFunction = (state: State, getters?: GettersMap) => unknown;

export type MutationFunction = (state: State, payload?: unknown) => void;

export type MutationsMap = Record<string, (pld?: unknown) => unknown>;

export type GettersMap = Record<string, () => unknown>;

export type ActionFunction = (
  context: ReaxContext,
  payload?: unknown,
) => Promise<void | unknown>;

export type GetterHook = () => unknown;

export interface Observable {
  value: unknown;
  subscribe: (listener: Subscriber) => () => void;
}

export interface StoreDescriptor {
  state: State;
  mutations?: Record<string, MutationFunction>;
  getters?: Record<string, GetterFunction>;
  modules?: Record<string, StoreDescriptor>;
  actions?: Record<string, ActionFunction>;
}

export interface ReaxContext {
  commit: (type: string, payload?: unknown) => void;
  getters: Record<string, () => unknown>;
  dispatch: (type: string, payload?: unknown) => Promise<void | unknown>;
}

export interface ReaxInstance {
  state: State;
  commit: (type: string, payload: unknown) => void;
  dispatch: (type: string, payload: unknown) => unknown | Promise<unknown>;
  registerModule: (name: string, descriptor: StoreDescriptor) => void;
  unregisterModule: (name: string) => void;
  $$instance: Observable;
  $$getterFunctions: Record<string, () => unknown>;
}

export interface ReaxInstanceForFunctional extends ReaxInstance {
  getters: Record<string, GetterHook>;
  $$rebuildGetters: () => void;
}

export interface ReaxInstanceForClasses extends ReaxInstance {
  connectGettersToState: (
    ctx: React.Component,
    getter: string | string[],
  ) => void;
}

export interface ReaxInstanceForAll extends ReaxInstance {
  getters: Record<string, GetterHook>;
  $$rebuildGetters: () => void;
  connectGettersToState: (
    ctx: React.Component,
    getter: string | string[],
  ) => void;
}

export interface ReactLikeComponentClass {
  setState: CallableFunction;
  componentWillUnmount: CallableFunction;
  state: Record<string, unknown>;
}
