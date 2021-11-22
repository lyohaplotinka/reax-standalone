function subscribeWithGetter(key, ctx) {
    if (!this.$$getterFunctions[key])
        return console.error(`[reax] unknown getter: "${key}"`);
    let oldValue = null;
    return this.$$instance.subscribe(() => {
        const currentValue = this.$$getterFunctions[key]();
        currentValue !== oldValue &&
            ctx.setState((prevState) => Object.assign(prevState, { [key]: (oldValue = currentValue) }));
    });
}
function connectGetterToState(ctx, getter) {
    const unsubscribeArray = []
        .concat(getter)
        .map((currentGetter) => subscribeWithGetter.call(this, currentGetter, ctx));
    const unmount = ctx.componentWillUnmount;
    ctx.componentWillUnmount = function () {
        unsubscribeArray.forEach((func) => func());
        unmount && unmount();
    }.bind(ctx);
}
export default function forClasses(store) {
    Object.defineProperty(store, 'connectGettersToState', {
        value: connectGetterToState,
        writable: false,
    });
    return store;
}
