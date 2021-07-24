import {
  GetterDescription,
  GetterFunction,
  Observable,
  ReaxInstance,
  ReaxInstanceForFunctional,
} from '../types';
import { useLayoutEffect, useState, useRef, useCallback } from 'react';

function useReaxGetter(
  getterDescription: GetterDescription,
  store: Observable,
  rawGetters: Record<string, GetterDescription>,
) {
  const prevValue = useRef(null);
  const forceRender = useState({})[1];

  const buildLocalGetters = useCallback(
    (getters: Record<string, GetterDescription>, storeValue: any) => {
      const result: Record<string, any> = {};
      for (const getterKey in getters) {
        if (!Object.prototype.hasOwnProperty.call(getters, getterKey)) continue;
        const getterDesc = getters[getterKey];
        result[getterKey] = () => getterDesc.func(storeValue, result);
      }
      return result;
    },
    [],
  );

  let currentValue = getterDescription.func(
    store.value[getterDescription.module],
    buildLocalGetters(rawGetters, store.value[getterDescription.module]),
  );

  useLayoutEffect(() => {
    const unsubscribe = store.subscribe((v: any) => {
      const storeValue = v[getterDescription.module];
      currentValue = getterDescription.func(
        storeValue,
        buildLocalGetters(rawGetters, storeValue),
      );
      if (prevValue.current !== currentValue) {
        prevValue.current = currentValue;
        forceRender({});
      }
    });
    return () => unsubscribe();
  }, [store]);

  return currentValue;
}

const buildGetters = (store: ReaxInstance) =>
  Object.entries(store.rawGetters).reduce(
    (total: Record<string, GetterFunction>, [key, func]) => {
      total[key] = () =>
        useReaxGetter(
          func as GetterDescription,
          store.$$instance,
          store.rawGetters,
        );
      return total;
    },
    {},
  );

export default function forFunctional(
  store: ReaxInstance,
): ReaxInstanceForFunctional {
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
  return <ReaxInstanceForFunctional>store;
}
