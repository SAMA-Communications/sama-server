import pino from "pino"
import pinoPretty from "pino-pretty"

import config from "../config/index.js"
import { asyncLoggerContextStore } from "./async_store.js"

const pinoPrettyStream = pinoPretty({
  colorize: true,
  translateTime: `dd HH:MM:ss.l`,
  sync: true,
  levelFirst: true,
  singleLine: config.get("logger.singleLine"),
})

const streams = [
  {
    level: config.get("logger.logLevel"),
    stream: pinoPrettyStream,
  },
]

const pinoLogger = pino(
  {
    level: config.get("logger.logLevel"),
    base: null,
  },
  pino.multistream(streams)
)

class PinoLogger {
  static START_REQUEST_TIME_PROP = "rStartTime"

  ignoreContextProps = [PinoLogger.START_REQUEST_TIME_PROP]

  constructor() {
    this.logger = pinoLogger
  }

  debug(stringPattern, ...args) {
    const logContext = this.#logContext()

    this.logger.debug(logContext, stringPattern, ...args)
  }

  log(stringPattern, ...args) {
    const logContext = this.#logContext()

    this.logger.trace(logContext, stringPattern, ...args)
  }

  warn(stringPattern, ...args) {
    const logContext = this.#logContext()

    this.logger.warn(logContext, stringPattern, ...args)
  }

  error(error, stringPattern, ...args) {
    const logContext = this.#logContext()

    const childLogger = this.logger.child(logContext)

    childLogger.error(error, stringPattern, ...args)
  }

  #logContext(context = {}) {
    const logContext = {}

    const asyncContext = asyncLoggerContextStore.getStore()

    if (asyncContext) {
      asyncContext.forEach((val, key) => (logContext[key] = val))
    }

    Object.assign(logContext, context, this.#addContextRequestTime(logContext))

    this.ignoreContextProps.forEach((propName) => delete logContext[propName])

    return logContext
  }

  #addContextRequestTime(logContext) {
    const rStartTime = logContext[PinoLogger.START_REQUEST_TIME_PROP]

    if (!rStartTime) {
      return {}
    }

    const requestTime = new Date() - rStartTime
    return { rTime: `${requestTime}ms` }
  }
}

export default new PinoLogger()
