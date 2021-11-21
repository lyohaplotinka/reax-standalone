import {
  GetterFunction,
  Observable,
  ReaxInstance,
  ReaxInstanceForFunctional,
} from '../../types';
import type { FrameworkHooksObject } from './types';

function useReaxGetter(
  store: Observable,
  getterFunction: () => any,
  hooks: FrameworkHooksObject,
) {
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

const buildGetters = (
  store: Observable,
  getterFunctions: Record<string, () => any>,
  hooks: FrameworkHooksObject,
) =>
  Object.entries(getterFunctions).reduce(
    (total: Record<string, GetterFunction>, [key, func]) => {
      total[key] = () => useReaxGetter(store, func, hooks);
      return total;
    },
    {},
  );

export default function forFunctionalCore(
  store: ReaxInstance,
  hooks: FrameworkHooksObject,
): ReaxInstanceForFunctional {
  Object.defineProperties(store, {
    getters: {
      value: buildGetters(store.$$instance, store.$$getterFunctions, hooks),
      enumerable: true,
      writable: true,
    },
    $$rebuildGetters: {
      value: function () {
        this.getters = buildGetters(
          this.$$instance,
          this.$$getterFunctions,
          hooks,
        );
      },
    },
  });
  return <ReaxInstanceForFunctional>store;
}
