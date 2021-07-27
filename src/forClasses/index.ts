import { Component } from 'react';
import { ReaxInstance, ReaxInstanceForClasses } from '../types';

function subscribeWithGetter(key: string, ctx: Component) {
  const relevantGetter = this.$$getterFunctions[key];
  if (!relevantGetter) return console.error(`[reax] unknown getter: "${key}"`);
  let oldValue: any = null;
  return this.$$subscribe(() => {
    const currentValue: any = relevantGetter();
    if (currentValue !== oldValue) {
      ctx.setState({
        ...ctx.state,
        [key]: currentValue,
      });
      oldValue = currentValue;
    }
  });
}

function connectGetterToState(ctx: Component, getter: string | string[]) {
  const unsubscribeArray: Array<() => void> = ([] as string[])
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

export default function forClasses(
  store: ReaxInstance,
): ReaxInstanceForClasses {
  Object.defineProperty(store, 'connectGettersToState', {
    value: connectGetterToState,
    writable: false,
  });
  return <ReaxInstanceForClasses>store;
}
