function subscribeWithGetter(key, ctx) {
    const relevantGetter = this.$$getterFunctions[key];
    if (!relevantGetter)
        return console.error(`[reax] unknown getter: "${key}"`);
    let oldValue = null;
    return this.$$subscribe(() => {
        const currentValue = relevantGetter();
        if (currentValue !== oldValue) {
            ctx.setState({
                ...ctx.state,
                [key]: currentValue,
            });
            oldValue = currentValue;
        }
    });
}
function connectGetterToState(ctx, getter) {
    const unsubscribeArray = []
        .concat(getter)
        .map((currentGetter) => subscribeWithGetter.call(this, currentGetter, ctx));
    const originalWillUnmount = ctx.componentWillUnmount;
    ctx.componentWillUnmount = function () {
        unsubscribeArray.forEach((func) => func());
        for (let i = 0; i < unsubscribeArray.length; i++) {
            unsubscribeArray[i]();
        }
        originalWillUnmount && originalWillUnmount();
    };
}
export default function forClasses(store) {
    Object.defineProperty(store, 'connectGettersToState', {
        value: connectGetterToState,
        writable: false,
    });
    return store;
}
