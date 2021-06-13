#reax-standalone

#### Tiny, fast and dependency-free React and Preact state management in style of Vuex

Features: 
* Super-simple API in the style of Vuex (mutations, getters, etc);
* **no** context providers: just import and use;
* super-easy connection for class-based components;
* static and dynamic modules support.

## Table of contents

1. [Motivation](#motivation)
2. [Important points](#important-points)
3. [Usage](#usage)
    1. [Usage with functional components](#usage-with-functional-components)
    2. [Usage with class-based components](#usage-with-class-based-components)
    3. [Usage with both types of component](#usage-for-both-types-of-component)
4. [Modules](#modules)
5. [Direct subscription](#direct-subscription)

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
  
## Usage

Install the package first:
```bash
npm install reax-standalone
```

Then, create a file describing your store:
```javascript
// src/store/index.js

import { createStore } from "reax-standalone";

const store = createStore({
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

### Usage with functional components

To optimize the size of the bundle, helpers for connecting to different 
types of React components have been moved to different modules. 

For use with functional components, update your module with the store like this:

```javascript
// src/store/index.js

import { createStore } from "reax-standalone";
// import the connection code
import forFunctional from "reax-sandalone/forFunctional"

const store = createStore({
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

// exporting a store ready to work with functional components
export default forFunctional(store)
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

### Usage with class-based components

For class-components, Reax maps the results of getter functions to a 
`state` object. To get started, connect the functionality in the store module:

```javascript
// src/store/index.js

import { createStore } from "reax-standalone";
// import the connection code
import forClasses from "reax-sandalone/forClasses"

const store = createStore({
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

// exporting a store ready to work with class components
export default forClasses(store)
```

Then, in your component:

```jsx
// App.jsx
import store from "./store";

class App extends React.Component {
  state = {};
  
  constructor() {
    super();
  }

  componentDidMount() {
    // Note that it is important to pass context to the method. 
    // Then the state will update automatically.
    // You can pass more than one getter in a string array, 
    // including module getters.
    store.connectGettersToState(this, ['getCount'])
  }
  
  render() {
    return (
      <div>
        <button onClick={() => {
          store.commit('incrementCount', 3)
        }}>
          {/* The state object will contain the keys corresponding to the keys */}
          {/* of the getters. If you have included a module getter, the */}
          {/* key will include a slash (this.state[myModule/getter]) */}
          count is: {this.state['getCount']}
        </button>
      </div>
    )
  }
}
```
That's it!

### Usage for both types of component
If you need to use Reax with both functional and class components, you 
can perform both connection functions in your store module:

```javascript
export default forClasses(forFunctional(store))
```

## Modules
As with Vuex, you can use modules. All modules are always namespaced. Accessing getters and mutations is similar to Vuex.

```javascript
// src/store/index.js

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

const store = {
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
}
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

const store = {
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
}
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

## Direct subscription
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
