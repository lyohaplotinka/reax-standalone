import type {
  ActionFunction,
  GettersMap,
  MutationsMap,
  Observable,
  ReaxInstance,
  State,
  StoreDescriptor,
  Subscriber,
} from './types';

function observable(v: unknown): Observable {
  let _v = v;
  const _list: Subscriber[] = [];
  return {
    get value() {
      return _v;
    },
    set value(v) {
      _v = v;
      _list.forEach((l) => l(v));
    },
    subscribe: (l) => {
      l(_v);
      const idx = _list.push(l) - 1;
      return () => _list.splice(idx, 1);
    },
  };
}

const createModule = (
  name: string,
  desc: StoreDescriptor,
  store: Observable,
  state: State,
  mutations: MutationsMap,
  getterFunctions: GettersMap,
  allActions: Record<string, ActionFunction>,
) => {
  const prefix = name === 'root' ? '' : name + '/';
  const moduleState = { [name]: desc.state };
  Object.assign(state, moduleState);
  Object.entries(desc.getters || {}).forEach(
    ([key, func]) =>
      (getterFunctions[prefix + key] = () =>
        func((store.value as State)[name] as State, getterFunctions)),
  );
  Object.entries(desc.mutations || {}).forEach(
    ([key, func]) =>
      (mutations[prefix + key] = (pld?: unknown) => {
        const _st = { ...((store.value as State)[name] as State) };
        func(_st, pld);
        return { [name]: _st };
      }),
  );
  Object.entries(desc.actions || {}).forEach(
    ([key, func]) => (allActions[prefix + key] = func),
  );
  return moduleState;
};

const deleteByKeyPart = (startsWith: string, object: Record<string, unknown>) =>
  Object.keys(object).forEach(
    (key) => key.startsWith(startsWith) && delete object[key],
  );

export function createStore(descriptor: StoreDescriptor): ReaxInstance {
  if (!Object.prototype.hasOwnProperty.call(descriptor, 'state'))
    throw new ReferenceError('[reax] state must be defined');
  const state: State = {};
  const mutations: MutationsMap = {};
  const getterFunctions: GettersMap = {};
  const allActions: Record<string, ActionFunction> = {};
  const { modules = {}, ...root } = descriptor;
  const allModules = { root, ...modules };

  const storeState = observable({});

  Object.entries(allModules).forEach((moduleEntry) =>
    createModule(
      moduleEntry[0],
      moduleEntry[1],
      storeState,
      state,
      mutations,
      getterFunctions,
      allActions,
    ),
  );

  storeState.value = state;

  const reaxStore = {
    get state() {
      const { root, ...rest } = storeState.value as { root: State };
      return Object.assign(root, rest);
    },
    commit: (type: string, payload: unknown) => {
      if (!mutations[type])
        return console.error('[reax] unknown mutation type:', type);
      storeState.value = Object.assign(
        storeState.value,
        mutations[type](payload),
      );
    },
    registerModule: function (name: string, descriptor: StoreDescriptor) {
      const moduleState = createModule(
        name,
        descriptor,
        storeState,
        state,
        mutations,
        getterFunctions,
        allActions,
      );
      this.$$getterFunctions = getterFunctions;
      this.$$rebuildGetters && this.$$rebuildGetters();
      storeState.value = { ...(storeState.value as State), ...moduleState };
    },
    unregisterModule: function (name: string) {
      const { [name]: deleted, ...newState } = storeState.value as {
        [key: string]: State;
      };
      deleteByKeyPart(name, mutations);
      deleteByKeyPart(name, this.getters);
      storeState.value = newState;
      this.$$getterFunctions = getterFunctions;
      this.$$rebuildGetters && this.$$rebuildGetters();
    },
    dispatch: async (type: string, payload?: unknown) => {
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
