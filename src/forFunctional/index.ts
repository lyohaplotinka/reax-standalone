import {
  GetterDescription,
  GetterFunction,
  Observable,
  ReaxInstance,
  ReaxInstanceForFunctional,
} from '../types';
import { useLayoutEffect, useState, useRef } from 'react';

function useReaxGetter(
  getterDescription: GetterDescription,
  store: Observable,
) {
  const prevValue = useRef(null);
  const forceRender = useState({})[1];
  let currentValue = getterDescription.func(
    store.value[getterDescription.module],
  );

  useLayoutEffect(() => {
    const unsubscribe = store.subscribe((v: any) => {
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

const buildGetters = (store: ReaxInstance) =>
  Object.entries(store.rawGetters).reduce(
    (total: Record<string, GetterFunction>, [key, func]) => {
      total[key] = () =>
        useReaxGetter(func as GetterDescription, store.$$instance);
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
