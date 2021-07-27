import 'regenerator-runtime/runtime';
import { createStore } from '../';

const storeDesc = {
  state: {
    count: 2,
  },
  mutations: {
    addToCount(state, payload) {
      state.count += payload;
    },
  },
  getters: {
    countSquared: (state) => state.count ** 2,
  },
  actions: {
    increaseCount(context) {
      setTimeout(() => {
        context.commit('addToCount', 1);
      }, 1000);
    },
    returnContext(context) {
      return context;
    },
  },
};

describe('Actions test', () => {
  let store = createStore(storeDesc);

  it('Context has all required parts', async () => {
    const context = await store.dispatch('returnContext');
    expect(typeof context.commit).toBe('function');
    expect(typeof context.dispatch).toBe('function');
    expect(typeof context.getters.countSquared).toBe('function');
  });

  it('Getter works correctly', () => {
    expect(store.$$getterFunctions.countSquared()).toBe(4);
  });

  it('No error when dispatching an action', () => {
    expect(() => store.dispatch('increaseCount')).not.toThrowError();
  });

  it('Old value right after dispatch because of timeout', () => {
    expect(store.$$instance.value.root.count).toBe(2);
  });

  it('Updates value after second', (done) => {
    store.dispatch('increaseCount');
    setTimeout(() => {
      expect(store.$$getterFunctions.countSquared()).toBe(16);
      done();
    }, 1500);
  });
});
