import { setTimeout } from "node:timers/promises"

class CancelQueueError extends Error {}
 
const promiseQueueWithJittering = (executablePromise, tryCount, delay) => {
  let isCanceled = false

  const cancel = () => isCanceled = true

  const start = async () => {
    if (isCanceled) {
      throw new CancelQueueError("Canceled")
    }

    const tryDelays = new Array(tryCount).fill(0).map((_, index) => {
      const tryCount = index + 1
      const tryDelay = Math.pow(tryCount, 2) * delay
      return tryDelay
    })
  
    let lastError = void 0
    
    console.log('[tryDelays]', tryDelays, isCanceled)
  
    for (const tryDelay of tryDelays) {
      try {
        console.log('[try]', tryDelay, isCanceled)

        if (isCanceled) {
          throw new CancelQueueError("Canceled")
        }

        await setTimeout(tryDelay)

        if (isCanceled) {
          throw new CancelQueueError("Canceled")
        }

        const successResult = await executablePromise()

        if (isCanceled) {
          throw new CancelQueueError("Canceled")
        }

        return successResult
      } catch (error) {
        lastError = error
      }
    }

    if (isCanceled) {
      throw new CancelQueueError("Canceled")
    }
  
    throw lastError
  }

  return { start, cancel }
}

export { promiseQueueWithJittering, CancelQueueError }