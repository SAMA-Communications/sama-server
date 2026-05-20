import { pino, type Logger as PinoBaseLogger } from "pino"
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
  pino.multistream(streams),
)

type LogContext = Record<string, unknown>

class PinoLogger {
  static readonly START_REQUEST_TIME_PROP = "rStartTime"

  ignoreContextProps: string[] = [PinoLogger.START_REQUEST_TIME_PROP]

  pinoLogger: PinoBaseLogger

  constructor(pinoLogger: PinoBaseLogger) {
    this.pinoLogger = pinoLogger
  }

  trace(stringPattern: string, ...args: unknown[]): void {
    const logContext = this.#logContext()

    this.pinoLogger.trace(logContext, stringPattern, ...args)
  }

  debug(stringPattern: string, ...args: unknown[]): void {
    const logContext = this.#logContext()

    this.pinoLogger.debug(logContext, stringPattern, ...args)
  }

  log(stringPattern: string, ...args: unknown[]): void {
    const logContext = this.#logContext()

    this.pinoLogger.trace(logContext, stringPattern, ...args)
  }

  warn(stringPattern: string, ...args: unknown[]): void {
    const logContext = this.#logContext()

    this.pinoLogger.warn(logContext, stringPattern, ...args)
  }

  error(error: unknown, stringPattern: string, ...args: unknown[]): void {
    const logContext = this.#logContext()

    const childLogger = this.pinoLogger.child(logContext)

    childLogger.error(error, stringPattern, ...args)
  }

  fatal(error: unknown, stringPattern: string, ...args: unknown[]): void {
    const logContext = this.#logContext()

    const childLogger = this.pinoLogger.child(logContext)

    childLogger.fatal(error, stringPattern, ...args)
  }

  child(msgPrefix: string, contextBindings: Record<string, unknown> = {}): PinoLogger {
    const childPinoLogger = this.pinoLogger.child(contextBindings, { msgPrefix: msgPrefix })

    return new PinoLogger(childPinoLogger)
  }

  #logContext(context: LogContext = {}): LogContext {
    const logContext: LogContext = {}

    const asyncContext = asyncLoggerContextStore.getStore()

    if (asyncContext) {
      asyncContext.forEach((val, key) => (logContext[key] = val))
    }

    Object.assign(logContext, context, this.#addContextRequestTime(logContext))

    this.ignoreContextProps.forEach((propName) => delete logContext[propName])

    return logContext
  }

  #addContextRequestTime(logContext: LogContext): LogContext {
    const rStartTime = logContext[PinoLogger.START_REQUEST_TIME_PROP]

    if (!rStartTime) {
      return {}
    }

    const requestTime = Number(new Date()) - Number(rStartTime)
    return { rTime: `${requestTime}ms` }
  }
}

export type Logger = PinoLogger

const logger = new PinoLogger(pinoLogger)

export default logger
