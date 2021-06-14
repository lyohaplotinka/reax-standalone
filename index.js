function createObservable(value) {
    let _value = value;
    let _idCount = -1;
    const _listeners = {};
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
const createModule = (name, descriptor) => {
    const prefix = name === 'root' ? '' : name + '/';
    return {
        moduleState: { [name]: descriptor.state },
        moduleGetters: Object.entries(descriptor.getters || {}).reduce((total, [key, func]) => {
            total[prefix + key] = { func, module: name };
            return total;
        }, {}),
        moduleMutations: Object.entries(descriptor.mutations || {}).reduce((total, [key, func]) => {
            total[prefix + key] = { func, module: name };
            return total;
        }, {}),
    };
};
const deleteByKeyPart = (startsWith, object) => {
    for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key) &&
            key.startsWith(startsWith))
            delete object[key];
    }
};
export function createStore(descriptor) {
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'state'))
        throw new ReferenceError('[reax] state must be defined');
    let state = {};
    let mutations = {};
    let rawGetters = {};
    const { modules = {}, ...root } = descriptor;
    const allModules = { root, ...modules };
    const attachModule = (name, descriptor) => {
        const { moduleState, moduleGetters, moduleMutations } = createModule(name, descriptor);
        state = { ...state, ...moduleState };
        mutations = { ...mutations, ...moduleMutations };
        rawGetters = { ...rawGetters, ...moduleGetters };
        return moduleState;
    };
    Object.entries(allModules).forEach((moduleEntry) => attachModule(...moduleEntry));
    const storeState = createObservable(state);
    return {
        $$instance: storeState,
        get state() {
            const { root, ...rest } = storeState.value;
            return { ...root, ...rest };
        },
        commit: (type, payload) => {
            if (!mutations[type])
                return console.error('[reax] unknown mutation type:', type);
            const { func, module } = mutations[type];
            const _st = { ...storeState.value[module] };
            func(_st, payload);
            storeState.value = { ...storeState.value, [module]: { ..._st } };
        },
        subscribe: storeState.subscribe.bind(storeState),
        registerModule: function (name, descriptor) {
            const moduleState = attachModule(name, descriptor);
            this.$$rebuildGetters && this.$$rebuildGetters();
            storeState.value = { ...storeState.value, ...moduleState };
        },
        unregisterModule: function (name) {
            const { [name]: deleted, ...newState } = storeState.value;
            deleteByKeyPart(name, mutations);
            deleteByKeyPart(name, this.getters);
            storeState.value = newState;
        },
        get rawGetters() {
            return rawGetters;
        },
    };
}
