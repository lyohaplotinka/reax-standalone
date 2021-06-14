import { useLayoutEffect, useState, useRef } from 'react';
function useReaxGetter(getterDescription, store) {
    const prevValue = useRef(null);
    const forceRender = useState({})[1];
    let currentValue = getterDescription.func(store.value[getterDescription.module]);
    useLayoutEffect(() => {
        const unsubscribe = store.subscribe((v) => {
            const storeValue = v[getterDescription.module];
            currentValue = getterDescription.func(storeValue);
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
    total[key] = () => useReaxGetter(func, store.$$instance);
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
