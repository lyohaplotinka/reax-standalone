import { useEffect, useReducer, useRef } from 'react';
import {
  GetterDescription,
  GetterFunction,
  MutationDescription,
  Observable,
  StoreDescriptor,
  Subscriber,
} from './types';

function createObservable(value: Subscriber): Observable {
  let _value = value;
  let _idCount = -1;
  const _listeners = new Map();
  return {
    get value() {
      return _value;
    },
    set value(v) {
      _value = v;
      _listeners.forEach((l) => l(v));
    },
    subscribe: (listener) => {
      listener(_value);
      _idCount++;
      _listeners.set(_idCount, listener);
      return () => _listeners.delete(_idCount);
    },
  };
}

function useReaxGetter(getterDescription: GetterDescription, store: any) {
  const prevValue = useRef(null);
  const [, forceRender] = useReducer((s) => s + 1, 0);
  let selectedState = getterDescription.func(
    store.value[getterDescription.module],
  );

  useEffect(() => {
    const unsubscribe = store.subscribe((v: any) => {
      const storeValue = v[getterDescription.module];
      selectedState = getterDescription.func(storeValue);
      if (prevValue.current !== selectedState) {
        prevValue.current = selectedState;
        forceRender();
      }
    });
    return () => unsubscribe();
  }, [store]);

  return selectedState;
}

const createModule = (name: string, descriptor: StoreDescriptor) => {
  const prefix = name === 'root' ? '' : name + '/';
  return {
    moduleState: { [name]: descriptor.state },
    moduleGetters: Object.entries(descriptor.getters || {}).reduce(
      (total: Record<string, any>, [key, func]) => {
        total[prefix + key] = { func, module: name };
        return total;
      },
      {},
    ),
    moduleMutations: Object.entries(descriptor.mutations || {}).reduce(
      (total: Record<string, any>, [key, func]) => {
        total[prefix + key] = { func, module: name };
        return total;
      },
      {},
    ),
  };
};

export function createStore(descriptor: StoreDescriptor) {
  if (!Object.prototype.hasOwnProperty.call(descriptor, 'state'))
    throw new ReferenceError('[reax] state must be defined');
  let state: any = {};
  let mutations: Record<string, MutationDescription> = {};
  let rawGetters: Record<string, GetterDescription> = {};
  let getters: any;
  const { modules = {}, ...root } = descriptor;
  const allModules = { root, ...modules };

  const attachModule = (name: string, descriptor: StoreDescriptor) => {
    const { moduleState, moduleGetters, moduleMutations } = createModule(
      name,
      descriptor,
    );
    state = { ...state, ...moduleState };
    mutations = { ...mutations, ...moduleMutations };
    rawGetters = { ...rawGetters, ...moduleGetters };
    getters = Object.entries(rawGetters).reduce(
      (total: Record<string, GetterFunction>, [key, func]) => {
        total[key] = () => useReaxGetter(func, storeState);
        return total;
      },
      {},
    );
    return moduleState;
  };

  const deleteByKeyPart = (startsWith: string, object: any) => {
    for (const key in object) {
      if (
        Object.prototype.hasOwnProperty.call(object, key) &&
        key.startsWith(startsWith)
      )
        delete object[key];
    }
  };

  Object.entries(allModules).forEach((moduleEntry) =>
    attachModule(...moduleEntry),
  );

  const storeState = createObservable(state);

  return {
    get state() {
      const { root, ...rest } = storeState.value;
      return { ...root, ...rest };
    },
    commit: (type: string, payload: any) => {
      if (!mutations[type])
        return console.error('[reax] unknown mutation type:', type);
      const { func, module } = mutations[type];
      const _st = { ...storeState.value[module] };
      func(_st, payload);
      storeState.value = { ...storeState.value, [module]: { ..._st } };
    },
    getters,
    subscribe: storeState.subscribe.bind(storeState),
    registerModule: function (name: string, descriptor: StoreDescriptor) {
      const moduleState = attachModule(name, descriptor);
      this.getters = getters;
      storeState.value = { ...storeState.value, ...moduleState };
    },
    unregisterModule: function (name: string) {
      const { [name]: deleted, ...newState } = storeState.value;
      deleteByKeyPart(name, mutations);
      deleteByKeyPart(name, this.getters);
      storeState.value = newState;
    },
  };
}
