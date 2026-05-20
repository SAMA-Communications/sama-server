import { AsyncLocalStorage } from "node:async_hooks"

export type LoggerContextStore = Map<string, unknown>

export const asyncLoggerContextStore = new AsyncLocalStorage<LoggerContextStore>()

export const createStore = (
  context: Record<string, unknown>,
  base: LoggerContextStore | Iterable<[string, unknown]> = [],
): LoggerContextStore => {
  const store = new Map(base)

  Object.entries(context).forEach(([key, val]) => store.set(key, val))

  return store
}

export const updateStoreContext = (key: string, value: unknown): void => {
  const store = asyncLoggerContextStore.getStore()

  if (!store) {
    return
  }

  store.set(key, value)
}
