### 1.1.0
* chore: switch to pnpm;
* chore: replaced husky with dependency-free solution;

### 1.0.1
* refactor: getters and mutations simplified;
* refactor: `$$selfUpdate` method deleted;
* refactor: `$$subscribe` method deleted, 
  use `$$instance.subscribe` instead;
* size reduction.

### 1.0.0
* BREAKING: `subscribe` => `$$subscribe`;
* BREAKING: `rawGetters` deleted (replaced with `$$getterFunctions`);
* actions implemented;
* getter system simplified.

### 0.1.0
* Add optional `getters` argument to all getters functions
  (for accessing getters inside getter);
* special `forAll` connection function for type safety.

### 0.0.1
First release
