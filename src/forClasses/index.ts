import {
  ReactLikeComponentClass,
  ReaxInstance,
  ReaxInstanceForClasses,
} from '../types';

function subscribeWithGetter(key: string, ctx: ReactLikeComponentClass) {
  if (!this.$$getterFunctions[key])
    return console.error(`[reax] unknown getter: "${key}"`);
  let oldValue: unknown = null;
  return this.$$instance.subscribe(() => {
    const currentValue: unknown = this.$$getterFunctions[key]();
    currentValue !== oldValue &&
      ctx.setState((prevState: Record<string, unknown>) =>
        Object.assign(prevState, { [key]: (oldValue = currentValue) }),
      );
  });
}

function connectGetterToState(
  ctx: ReactLikeComponentClass,
  getter: string | string[],
) {
  const unsubscribeArray = ([] as string[])
    .concat(getter)
    .map((currentGetter) => subscribeWithGetter.call(this, currentGetter, ctx));

  const unmount = ctx.componentWillUnmount;
  ctx.componentWillUnmount = function () {
    unsubscribeArray.forEach((func) => func());
    unmount && unmount();
  }.bind(ctx);
}

export default function forClasses(
  store: ReaxInstance,
): ReaxInstanceForClasses {
  Object.defineProperty(store, 'connectGettersToState', {
    value: connectGetterToState,
    writable: false,
  });
  return <ReaxInstanceForClasses>store;
}
