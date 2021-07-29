import type {
  ActionFunction,
  GettersMap,
  MutationsMap,
  Observable,
  ReaxInstance,
  StoreDescriptor,
  Subscriber,
} from './types';

function observable(value: any): Observable {
  let _val = value;
  let _id = -1;
  const _listeners: Record<string, Subscriber> = {};
  return {
    get value() {
      return _val;
    },
    set value(v) {
      _val = v;
      Object.values(_listeners).forEach((l) => l(v));
    },
    subscribe: (listener) => {
      listener(_val);
      const currentId = _id++;
      _listeners[currentId] = listener;
      return () => delete _listeners[currentId];
    },
  };
}

const createModule = (
  name: string,
  desc: StoreDescriptor,
  store: Observable,
) => {
  const prefix = name === 'root' ? '' : name + '/';
  return {
    mState: { [name]: desc.state },
    mGetters: Object.entries(desc.getters || {}).reduce(
      (total: Record<string, any>, [key, func]) => {
        total[prefix + key] = () => func(store.value[name], total);
        return total;
      },
      {},
    ),
    mMuts: Object.entries(desc.mutations || {}).reduce(
      (total: Record<string, any>, [key, func]) => {
        total[prefix + key] = (pld?: any) => {
          const _st = { ...store.value[name] };
          func(_st, pld);
          return { [name]: _st };
        };
        return total;
      },
      {},
    ),
    mActs: Object.entries(desc.actions || {}).reduce(
      (total: Record<string, any>, [key, func]) => {
        total[prefix + key] = func;
        return total;
      },
      {},
    ),
  };
};

const deleteByKeyPart = (startsWith: string, object: Record<string, any>) =>
  Object.keys(object).forEach(
    (key) => key.startsWith(startsWith) && delete object[key],
  );

export function createStore(descriptor: StoreDescriptor): ReaxInstance {
  if (!Object.prototype.hasOwnProperty.call(descriptor, 'state'))
    throw new ReferenceError('[reax] state must be defined');
  let state: any = {};
  let mutations: MutationsMap = {};
  let getterFunctions: GettersMap = {};
  let allActions: Record<string, ActionFunction> = {};
  const { modules = {}, ...root } = descriptor;
  const allModules = { root, ...modules };

  const storeState = observable({});

  const attachModule = (name: string, descriptor: StoreDescriptor) => {
    const { mState, mGetters, mMuts, mActs } = createModule(
      name,
      descriptor,
      storeState,
    );
    state = Object.assign(state, mState);
    mutations = Object.assign(mutations, mMuts);
    getterFunctions = Object.assign(getterFunctions, mGetters);
    allActions = Object.assign(allActions, mActs);
    return mState;
  };

  Object.entries(allModules).forEach((moduleEntry) =>
    attachModule(...moduleEntry),
  );

  storeState.value = state;

  const reaxStore = {
    get state() {
      const { root, ...rest } = storeState.value;
      return Object.assign(root, rest);
    },
    commit: (type: string, payload: any) => {
      if (!mutations[type])
        return console.error('[reax] unknown mutation type:', type);
      storeState.value = Object.assign(
        storeState.value,
        mutations[type](payload),
      );
    },
    registerModule: function (name: string, descriptor: StoreDescriptor) {
      const moduleState = attachModule(name, descriptor);
      this.$$getterFunctions = getterFunctions;
      this.$$rebuildGetters && this.$$rebuildGetters();
      storeState.value = { ...storeState.value, ...moduleState };
    },
    unregisterModule: function (name: string) {
      const { [name]: deleted, ...newState } = storeState.value;
      deleteByKeyPart(name, mutations);
      deleteByKeyPart(name, this.getters);
      storeState.value = newState;
      this.$$getterFunctions = getterFunctions;
      this.$$rebuildGetters && this.$$rebuildGetters();
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
    $$getterFunctions: getterFunctions,
    $$instance: storeState,
  };

  Object.keys(reaxStore).forEach(
    (key: string) =>
      key.startsWith('$$') &&
      Object.defineProperty(reaxStore, key, { enumerable: false }),
  );

  return reaxStore;
}
