function observable(value) {
    let _val = value;
    let _id = -1;
    const _listeners = {};
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
const createModule = (name, desc, store) => {
    const prefix = name === 'root' ? '' : name + '/';
    return {
        mState: { [name]: desc.state },
        mGetters: Object.entries(desc.getters || {}).reduce((total, [key, func]) => {
            total[prefix + key] = () => func(store.value[name], total);
            return total;
        }, {}),
        mMuts: Object.entries(desc.mutations || {}).reduce((total, [key, func]) => {
            total[prefix + key] = (pld) => {
                const _st = { ...store.value[name] };
                func(_st, pld);
                return { [name]: _st };
            };
            return total;
        }, {}),
        mActs: Object.entries(desc.actions || {}).reduce((total, [key, func]) => {
            total[prefix + key] = func;
            return total;
        }, {}),
    };
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
    const attachModule = (name, descriptor) => {
        const { mState, mGetters, mMuts, mActs } = createModule(name, descriptor, storeState);
        state = Object.assign(state, mState);
        mutations = Object.assign(mutations, mMuts);
        getterFunctions = Object.assign(getterFunctions, mGetters);
        allActions = Object.assign(allActions, mActs);
        return mState;
    };
    Object.entries(allModules).forEach((moduleEntry) => attachModule(...moduleEntry));
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
            const moduleState = attachModule(name, descriptor);
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
