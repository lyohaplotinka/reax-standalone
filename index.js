function observable(v) {
    let _v = v;
    const _list = [];
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
const createModule = (name, desc, store, state, mutations, getterFunctions, allActions) => {
    const prefix = name === 'root' ? '' : name + '/';
    const moduleState = { [name]: desc.state };
    Object.assign(state, moduleState);
    Object.entries(desc.getters || {}).forEach(([key, func]) => (getterFunctions[prefix + key] = () => func(store.value[name], getterFunctions)));
    Object.entries(desc.mutations || {}).forEach(([key, func]) => (mutations[prefix + key] = (pld) => {
        const _st = { ...store.value[name] };
        func(_st, pld);
        return { [name]: _st };
    }));
    Object.entries(desc.actions || {}).forEach(([key, func]) => (allActions[prefix + key] = func));
    return moduleState;
};
const deleteByKeyPart = (startsWith, object) => Object.keys(object).forEach((key) => key.startsWith(startsWith) && delete object[key]);
export function createStore(descriptor) {
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'state'))
        throw new ReferenceError('[reax] state must be defined');
    let state = {};
    let mutations = {};
    let getterFunctions = {};
    let allActions = {};
    const { modules = {}, ...root } = descriptor;
    const allModules = { root, ...modules };
    const storeState = observable({});
    Object.entries(allModules).forEach((moduleEntry) => createModule(moduleEntry[0], moduleEntry[1], storeState, state, mutations, getterFunctions, allActions));
    storeState.value = state;
    const reaxStore = {
        get state() {
            const { root, ...rest } = storeState.value;
            return Object.assign(root, rest);
        },
        commit: (type, payload) => {
            if (!mutations[type])
                return console.error('[reax] unknown mutation type:', type);
            storeState.value = Object.assign(storeState.value, mutations[type](payload));
        },
        registerModule: function (name, descriptor) {
            const moduleState = createModule(name, descriptor, storeState, state, mutations, getterFunctions, allActions);
            this.$$getterFunctions = getterFunctions;
            this.$$rebuildGetters && this.$$rebuildGetters();
            storeState.value = { ...storeState.value, ...moduleState };
        },
        unregisterModule: function (name) {
            const { [name]: deleted, ...newState } = storeState.value;
            deleteByKeyPart(name, mutations);
            deleteByKeyPart(name, this.getters);
            storeState.value = newState;
            this.$$getterFunctions = getterFunctions;
            this.$$rebuildGetters && this.$$rebuildGetters();
        },
        dispatch: async (type, payload) => {
            return allActions[type]({
                commit: reaxStore.commit,
                dispatch: reaxStore.dispatch,
                getters: reaxStore.$$getterFunctions,
            }, payload);
        },
        $$getterFunctions: getterFunctions,
        $$instance: storeState,
    };
    Object.keys(reaxStore).forEach((key) => key.startsWith('$$') &&
        Object.defineProperty(reaxStore, key, { enumerable: false }));
    return reaxStore;
}
