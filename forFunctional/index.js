import { useLayoutEffect, useState, useRef, useCallback } from 'react';
function useReaxGetter(getterDescription, store, rawGetters) {
    const prevValue = useRef(null);
    const forceRender = useState({})[1];
    const buildLocalGetters = useCallback((getters, storeValue) => {
        const result = {};
        for (const getterKey in getters) {
            if (!Object.prototype.hasOwnProperty.call(getters, getterKey))
                continue;
            const getterDesc = getters[getterKey];
            result[getterKey] = () => getterDesc.func(storeValue, result);
        }
        return result;
    }, []);
    let currentValue = getterDescription.func(store.value[getterDescription.module], buildLocalGetters(rawGetters, store.value[getterDescription.module]));
    useLayoutEffect(() => {
        const unsubscribe = store.subscribe((v) => {
            const storeValue = v[getterDescription.module];
            currentValue = getterDescription.func(storeValue, buildLocalGetters(rawGetters, storeValue));
            if (prevValue.current !== currentValue) {
                prevValue.current = currentValue;
                forceRender({});
            }
        });
        return () => unsubscribe();
    }, [store]);
    return currentValue;
}
const buildGetters = (store) => Object.entries(store.rawGetters).reduce((total, [key, func]) => {
    total[key] = () => useReaxGetter(func, store.$$instance, store.rawGetters);
    return total;
}, {});
export default function forFunctional(store) {
    Object.defineProperties(store, {
        getters: {
            value: buildGetters(store),
            enumerable: true,
            writable: true,
        },
        $$rebuildGetters: {
            value: function () {
                this.getters = buildGetters(store);
            },
        },
    });
    return store;
}
