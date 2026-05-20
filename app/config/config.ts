import _ from "lodash"

import type { ConfigValues } from "./config-values.js"

export default class Config {
  config: ConfigValues

  constructor(config: ConfigValues) {
    this.config = config
  }

  get<T = unknown>(varPath: string): T {
    return _.get(this.config, varPath) as T
  }

  set(varPath: string, val: unknown, setOnlyIfEmpty?: boolean): unknown {
    const currentVal = this.get(varPath)

    if (currentVal && setOnlyIfEmpty) {
      return currentVal
    }

    _.set(this.config, varPath, val)

    return val
  }

  merge(subConfig: Record<string, unknown>): ConfigValues {
    _.merge(this.config, subConfig)

    return this.config
  }

  toObject(): ConfigValues {
    return this.config
  }
}
