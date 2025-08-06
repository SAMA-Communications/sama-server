import _ from "lodash"

class Config {
  constructor(config) {
    this.config = config
  }

  get(varPath) {
    return _.get(this.config, varPath)
  }

  set(varPath, val, setOnlyIfEmpty) {
    const currentVal = this.get(varPath)

    if (currentVal && setOnlyIfEmpty) {
      return currentVal
    }

    _.set(this.config, varPath, val)

    return val
  }

  merge(subConfig) {
    _.merge(this.config, subConfig)

    return this.config
  }

  toObject() {
    return this.config
  }
}

export default Config
