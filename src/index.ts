import {
  ActionFunction,
  GetterDescription,
  MutationDescription,
  Observable,
  ReaxInstance,
  StoreDescriptor,
  Subscriber,
} from './types';

function createObservable(value: Subscriber): Observable {
  let _value = value;
  let _idCount = -1;
  const _listeners: Record<string, Subscriber> = {};
  return {
    get value() {
      return _value;
    },
    set value(v) {
      _value = v;
      Object.values(_listeners).forEach((l) => l(v));
    },
    subscribe: (listener) => {
      listener(_value);
      _idCount++;
      const currentId = String(_idCount);
      _listeners[currentId] = listener;
      return () => delete _listeners[currentId];
    },
  };
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
    moduleActions: Object.entries(descriptor.actions || {}).reduce(
      (total: Record<string, any>, [key, func]) => {
        total[prefix + key] = func;
        return total;
      },
      {},
    ),
  };
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

const createGetters = (
  getters: Record<string, GetterDescription>,
  store: Observable,
) =>
  Object.entries(getters).reduce(
    (allGetters: Record<string, () => any>, [getterKey, getterDesc]) => {
      allGetters[getterKey] = () =>
        getterDesc.func(store.value[getterDesc.module], allGetters);
      return allGetters;
    },
    {},
  );

export function createStore(descriptor: StoreDescriptor): ReaxInstance {
  if (!Object.prototype.hasOwnProperty.call(descriptor, 'state'))
    throw new ReferenceError('[reax] state must be defined');
  let state: any = {};
  let mutations: Record<string, MutationDescription> = {};
  let rawGetters: Record<string, GetterDescription> = {};
  let allActions: Record<string, ActionFunction> = {};
  const { modules = {}, ...root } = descriptor;
  const allModules = { root, ...modules };

  const attachModule = (name: string, descriptor: StoreDescriptor) => {
    const { moduleState, moduleGetters, moduleMutations, moduleActions } =
      createModule(name, descriptor);
    state = Object.assign(state, moduleState);
    mutations = Object.assign(mutations, moduleMutations);
    rawGetters = Object.assign(rawGetters, moduleGetters);
    allActions = Object.assign(allActions, moduleActions);
    return moduleState;
  };

  Object.entries(allModules).forEach((moduleEntry) =>
    attachModule(...moduleEntry),
  );

  const storeState = createObservable(state);

  const reaxStore = {
    get state() {
      const { root, ...rest } = storeState.value;
      return Object.assign(root, rest);
    },
    commit: (type: string, payload: any) => {
      if (!mutations[type])
        return console.error('[reax] unknown mutation type:', type);
      const { func, module } = mutations[type];
      const _st = JSON.parse(JSON.stringify(storeState.value[module]));
      func(_st, payload);
      storeState.value = { ...storeState.value, [module]: { ..._st } };
    },
    registerModule: function (name: string, descriptor: StoreDescriptor) {
      const moduleState = attachModule(name, descriptor);
      this.$$rebuildGetters ? this.$$rebuildGetters() : this.$$selfUpdate();
      storeState.value = { ...storeState.value, ...moduleState };
    },
    unregisterModule: function (name: string) {
      const { [name]: deleted, ...newState } = storeState.value;
      deleteByKeyPart(name, mutations);
      deleteByKeyPart(name, this.getters);
      storeState.value = newState;
      this.$$rebuildGetters ? this.$$rebuildGetters() : this.$$selfUpdate();
    },
    dispatch: async (type: string, payload?: any) => {
      return allActions[type](
        {
          commit: reaxStore.commit,
          dispatch: reaxStore.dispatch,
          getters: reaxStore.$$getterFunctions,
        },
        payload,
      );
    },
    $$getterFunctions: createGetters(rawGetters, storeState),
    $$subscribe: storeState.subscribe.bind(storeState),
    $$instance: storeState,
    $$selfUpdate: function () {
      this.$$getterFunctions = createGetters(rawGetters, storeState);
    },
  };

  Object.keys(reaxStore).forEach(
    (key: string) =>
      key.startsWith('$$') &&
      Object.defineProperty(reaxStore, key, { enumerable: false }),
  );

  return reaxStore;
}
