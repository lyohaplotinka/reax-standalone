#reax-standalone

#### Tiny, fast and dependency-free React and Preact state management in style of Vuex

Features: 
* Super-simple API in the style of Vuex (mutations, getters, etc);
* **no** context providers: just import and use;
* static and dynamic modules support.

### Motivation

I love Vuex and find it the most convenient library for managing the 
application state. I already have a [reax-store](https://github.com/lyohaplotinka/reax-store) project, a Redux addon 
that provides a Vuex style API. This repository is a standalone 
implementation with no dependencies, neither from Redux nor anything 
else.

The **reax-store** itself is very lightweight (roughly 700 bytes), but 
this size does not include Redux. **Reax-standalone** provides its own 
Observable implementation, so the total compressed size of this 
library, which doesn't need anything else to run, is not much larger 
than the reax-store.

### Important points
* It is **not 100% Vuex compatible**. Please do not open issues related 
  to API mismatch or the fact that some things are not quite in the 
  places where you expect.
* In this implementation, there are no "actions" since I believe that 
  they should not be in the store :)
* This library is primarily aimed at components in a functional style, 
  there are no special solutions for class components (yet???).
  
### Getting started

Install the package first:
```bash
npm install reax-standalone
```

Then, create a file describing your store:
```javascript
// src/store/index.js

import { createStore } from "reax-standalone";

export default createStore({
  state: {
      count: 0
  },
  mutations: {
      incrementCount(state, payload) {
          state.count += payload ?? 1
      }
  },
  getters: {
      getCount: state => state.count
  }
})
```

After that you can use Reax in your components like this:

```jsx
// App.jsx
import store from "./store";

function App() {
  // Please note: unlike Vuex, we must call 
  // the getter function, since in Reax this 
  // is just a wrapper over the react hooks
  const count = store.getters.getCount()
  
  return (
      <div>
        <p>{count}</p>
        <button onClick={() => {
          store.commit('incrementCount', 3)
        }}>
          count is: {count}
        </button>
      </div>
  )
}
```
That's it!

### Modules
As with Vuex, you can use modules. All modules are always namespaced. Accessing getters and mutations is similar to Vuex.

```javascript
// src/store/index.js

import { createReaxStore } from "reax-store";

const LetterModule = {
  state: {
      text: 'a'
  },
  mutations: {
      addA(state) {
          state.text += 'a'
      }
  },
  getters: {
      getText: state => state.text
  }
}

export default createReaxStore({
  state: {
      count: 0
  },
  mutations: {
      incrementCount(state, payload) {
          state.count += payload ?? 1
      }
  },
  getters: {
      getCount: state => state.count
  },
  modules: {
      LetterModule
  }
})
```

```jsx
// App.jsx
import store from "./store";

function App() {
  const count = store.getters.getCount()
  const letters = store.getters['LetterModule/getText']()
  
  return (
      <div>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => {
          store.commit('incrementCount', 3)
          store.commit('LetterModule/addA')
        }}>
          count is: {count}
        </button>
      </div>
  )
}
```

You can register and unregister modules dynamically using the 
`registerModule` and `unregisterModule` methods of the store instance.

```javascript
// src/store/index.js

import { createReaxStore } from "reax-store";

export const LetterModule = {
  state: {
      text: 'a'
  },
  mutations: {
      addA(state) {
          state.text += 'a'
      }
  },
  getters: {
      getText: state => state.text
  }
}

export default createReaxStore({
  state: {
      count: 0
  },
  mutations: {
      incrementCount(state, payload) {
          state.count += payload ?? 1
      }
  },
  getters: {
      getCount: state => state.count
  }
})
```
```jsx
// App.jsx
import store, { LetterModule } from "./store";

store.registerModule('LetterModule', LetterModule)

function App() {
  useEffect(() => {
      return () => store.unregisterModule('LetterModule')
  }, [])
    
  const count = store.getters.getCount()
  const letters = store.getters['LetterModule/getText']()
  
  return (
      <div>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => {
          store.commit('incrementCount', 3)
          store.commit('LetterModule/addA')
        }}>
          count is: {count}
        </button>
      </div>
  )
}
```

### Direct subscription
You can subscribe to update the store state directly via the 
`subscribe` method. As an argument, pass a callback that will 
accept the updated state of the store. Calling the `subscribe` 
method will return an unsubscribe function: call it when the 
subscription is no longer needed.
```javascript
import store from './store';

const unsubscribe = store.subscribe(value => {
    // ...
})

// Calling unsubscribe: the above handler is no longer needed
unsubscribe()
```

### TODO
* [ ] Accessing Global Assets in modules (getters, rootState, rootGetters) for getter functions
