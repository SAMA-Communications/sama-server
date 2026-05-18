import { setTimeout } from "node:timers/promises"

import mainLogger from "../logger/index.js"

const reconnectLogger = mainLogger.child("[Reconnect]")

class CancelQueueError extends Error {}

export type PromiseQueueWithJittering<T> = {
  start: () => Promise<T | undefined>
  cancel: () => boolean
}

export const promiseQueueWithJittering = <T>(
  executablePromise: (checkIsCanceled: () => boolean) => Promise<T>,
  tryCount: number,
  delay: number,
): PromiseQueueWithJittering<T> => {
  let isCanceled = false

  const cancel = (): boolean => (isCanceled = true)
  const checkIsCanceled = (): boolean => isCanceled

  const start = async (): Promise<T | undefined> => {
    if (isCanceled) {
      throw new CancelQueueError("Canceled")
    }

    const tryDelays = new Array(tryCount).fill(0).map((_, index) => {
      const tryCount = index + 1
      const tryDelay = Math.pow(tryCount, 2) * delay
      return tryDelay
    })

    let lastError: unknown = void 0

    reconnectLogger.debug("[tryDelays] %j %s", tryDelays, isCanceled)

    for (const tryDelay of tryDelays) {
      try {
        reconnectLogger.debug("[try] %s %s", tryDelay, isCanceled)

        if (isCanceled) {
          throw new CancelQueueError("Canceled")
        }

        await setTimeout(tryDelay)

        if (isCanceled) {
          throw new CancelQueueError("Canceled")
        }

        const successResult = await executablePromise(checkIsCanceled)

        return successResult
      } catch (error) {
        lastError = error
        if (error instanceof CancelQueueError) {
          break
        }
      }
    }

    if (lastError) {
      throw lastError
    }

    if (isCanceled) {
      throw new CancelQueueError("Canceled")
    }
  }

  return { start, cancel }
}

export { CancelQueueError }
