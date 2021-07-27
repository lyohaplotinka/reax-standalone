import { useLayoutEffect, useState, useRef } from 'react';
function useReaxGetter(store, getterFunction) {
    const prevValue = useRef(null);
    const forceRender = useState({})[1];
    let currentValue = getterFunction();
    useLayoutEffect(() => {
        const unsubscribe = store.subscribe(() => {
            currentValue = getterFunction();
            if (prevValue.current !== currentValue) {
                prevValue.current = currentValue;
                forceRender({});
            }
        });
        return () => unsubscribe();
    }, [store]);
    return currentValue;
}
const buildGetters = (store, getterFunctions) => Object.entries(getterFunctions).reduce((total, [key, func]) => {
    total[key] = () => useReaxGetter(store, func);
    return total;
}, {});
export default function forFunctional(store) {
    Object.defineProperties(store, {
        getters: {
            value: buildGetters(store.$$instance, store.$$getterFunctions),
            enumerable: true,
            writable: true,
        },
        $$rebuildGetters: {
            value: function () {
                this.$$selfUpdate();
                this.getters = buildGetters(this.$$instance, this.$$getterFunctions);
            },
        },
    });
    return store;
}
