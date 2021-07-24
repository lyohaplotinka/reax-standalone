import { Component } from 'react';
import {
  GetterDescription,
  ReaxInstance,
  ReaxInstanceForClasses,
} from '../types';

const buildLocalGetters = (
  getters: Record<string, GetterDescription>,
  storeValue: any,
) => {
  const result: Record<string, any> = {};
  for (const getterKey in getters) {
    if (!Object.prototype.hasOwnProperty.call(getters, getterKey)) continue;
    const getterDesc = getters[getterKey];
    result[getterKey] = () =>
      getterDesc.func(storeValue[getterDesc.module], result);
  }
  return result;
};

function subscribeWithGetter(key: string, ctx: Component) {
  const relevantGetter = this.rawGetters[key];
  if (!relevantGetter) return console.error(`[reax] unknown getter: "${key}"`);
  const { module, func } = relevantGetter;
  return this.subscribe((value: any) => {
    ctx.setState({
      ...ctx.state,
      [key]: func(value[module], buildLocalGetters(this.rawGetters, value)),
    });
  });
}

function connectGetterToState(ctx: Component, getter: string | string[]) {
  const unsubscribeArray: Array<() => void> = [];
  if (Array.isArray(getter)) {
    for (let i = 0; i < getter.length; i++) {
      const unsubscribe = subscribeWithGetter.call(this, getter[i], ctx);
      if (unsubscribe) unsubscribeArray.push(unsubscribe);
    }
  } else {
    const unsubscribe = subscribeWithGetter.call(this, getter, ctx);
    if (unsubscribe) unsubscribeArray.push(unsubscribe);
  }

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
