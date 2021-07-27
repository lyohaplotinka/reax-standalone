import 'regenerator-runtime/runtime';
import { createStore } from '../';

const noState = {
  mutations: {},
  getters: {},
};

const noGetters = {
  state: { id: 0 },
  mutations: {
    setId(state, payload) {
      state.id = payload;
    },
  },
};

const noMutations = {
  state: { id: 0 },
  getters: {
    getId: (state) => state.id,
  },
};

describe('Data lack tests', () => {
  it('Throws an error if no state defined', () => {
    expect(() => createStore(noState)).toThrowError();
  });

  it('Does not throw an error if no getters defined', () => {
    expect(() => createStore(noGetters)).not.toThrowError();
  });

  it('Does not throw an error if no mutations defined', () => {
    expect(() => createStore(noMutations)).not.toThrowError();
  });
});
