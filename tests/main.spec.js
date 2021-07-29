import 'regenerator-runtime/runtime';
import { createStore } from '../';
import forFunctional from '../forFunctional';
import forClasses from '../forClasses';

const baseMock = {
  state: { id: 0 },
  mutations: {
    setId(state, payload) {
      state.id = payload;
    },
  },
  getters: {
    getId: (state) => state.id,
  },
};

let store, unsubscribe;

describe('Base tests', () => {
  it('Exports function', () => {
    expect(typeof createStore).toBe('function');
  });

  it('Creates store without errors', () => {
    expect(() => {
      store = forFunctional(createStore(baseMock));
    }).not.toThrowError();
  });

  it('Has direct access to state', () => {
    expect(store.state.id).toBe(0);
  });

  it('Changes state in direct access after commit', () => {
    store.commit('setId', 5);
    expect(store.state.id).toBe(5);
  });

  it('Trying to commit unknown mutation does not throws an error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      store.commit('Unknown');
    }).not.toThrowError();
  });

  it('Has getters; getters are React hooks', () => {
    expect(typeof store.getters.getId).toBe('function');
    expect(() => {
      store.getters.getId();
    }).toThrowError(/Invalid hook call/);
  });

  it('Subscribe method returns function', () => {
    unsubscribe = store.$$instance.subscribe((value) => value);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('Subscribe listener emits value on update', (done) => {
    let iterIdx = 0;
    unsubscribe = store.$$instance.subscribe((value) => {
      if (!iterIdx) {
        iterIdx++;
        return;
      }
      expect(value.root.id).toBe(10);
      done();
    });
    store.commit('setId', 10);
  });

  it('Has connection method for class-based components', () => {
    store = forClasses(store);
    expect(typeof store.connectGettersToState).toBe('function');
  });
});
