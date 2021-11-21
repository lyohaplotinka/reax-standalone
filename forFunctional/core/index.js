function useReaxGetter(store, getterFunction, hooks) {
    const { useState, useRef, useLayoutEffect } = hooks;
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
const buildGetters = (store, getterFunctions, hooks) => Object.entries(getterFunctions).reduce((total, [key, func]) => {
    total[key] = () => useReaxGetter(store, func, hooks);
    return total;
}, {});
export default function forFunctionalCore(store, hooks) {
    Object.defineProperties(store, {
        getters: {
            value: buildGetters(store.$$instance, store.$$getterFunctions, hooks),
            enumerable: true,
            writable: true,
        },
        $$rebuildGetters: {
            value: function () {
                this.getters = buildGetters(this.$$instance, this.$$getterFunctions, hooks);
            },
        },
    });
    return store;
}
