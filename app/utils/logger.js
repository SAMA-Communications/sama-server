class Logger {
  static getTimestamp() {
    return new Date().toISOString()
  }

  static log(message, ...args) {
    const timestamp = this.getTimestamp()
    console.log(`[${timestamp}] ${message}`, ...args)
  }

  static warn(message, ...args) {
    const timestamp = this.getTimestamp()
    console.warn(`[${timestamp}] ${message}`, ...args)
  }

  static error(message, ...args) {
    const timestamp = this.getTimestamp()
    console.error(`[${timestamp}] ${message}`, ...args)
  }

  static info(message, ...args) {
    const timestamp = this.getTimestamp()
    console.info(`[${timestamp}] ${message}`, ...args)
  }

  static debug(message, ...args) {
    const timestamp = this.getTimestamp()
    console.debug(`[${timestamp}] ${message}`, ...args)
  }

  // Specialized Redis logging methods
  static redis(component, action, message, ...args) {
    const timestamp = this.getTimestamp()
    console.log(`[${timestamp}][Redis][${component}][${action}] ${message}`, ...args)
  }

  static redisError(component, action, error, ...args) {
    const timestamp = this.getTimestamp()
    console.warn(`[${timestamp}][Redis][${component}][${action}] ${error.message}`, error.code, ...args)
  }

  static redisWarn(component, action, message, ...args) {
    const timestamp = this.getTimestamp()
    console.warn(`[${timestamp}][Redis][${component}][${action}] ${message}`, ...args)
  }

  // Specialized shutdown logging
  static shutdown(action, message, ...args) {
    const timestamp = this.getTimestamp()
    console.log(`[${timestamp}][Shutdown][${action}] ${message}`, ...args)
  }

  static shutdownError(action, error, ...args) {
    const timestamp = this.getTimestamp()
    console.error(`[${timestamp}][Shutdown][${action}] ${error.message}`, ...args)
  }

  // Specialized monitor logging
  static monitor(component, action, message, ...args) {
    const timestamp = this.getTimestamp()
    console.log(`[${timestamp}][Monitor][${component}][${action}] ${message}`, ...args)
  }

  static monitorWarn(component, action, message, ...args) {
    const timestamp = this.getTimestamp()
    console.warn(`[${timestamp}][Monitor][${component}][${action}] ${message}`, ...args)
  }

  static monitorError(component, action, error, ...args) {
    const timestamp = this.getTimestamp()
    console.error(`[${timestamp}][Monitor][${component}][${action}] ${error.message}`, ...args)
  }
}

export default Logger 