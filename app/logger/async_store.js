import { AsyncLocalStorage } from "node:async_hooks"

const asyncLoggerContextStore = new AsyncLocalStorage()

const createStore = (context, base = []) => {
  const store = new Map(base)

  Object.entries(context).forEach(([key, val]) => store.set(key, val))

  return store
}

const updateStoreContext = (key, value) => {
  const store = asyncLoggerContextStore.getStore()

  if (!store) {
    return
  }

  store.set(key, value)
}

export { asyncLoggerContextStore, createStore, updateStoreContext }
