import { slice } from '../utils/req_res_utils.js'

class BaseModel {
  constructor(params, mappedParams) {
    this.params = params ?? {}
    this.mappedParams = mappedParams ?? {}
  }

  static get collection() {
    throw new Error('Not implemented')
  }

  static get visibleFields() {
    throw new Error('Not implemented')
  }

  static get originalFields() {
    throw new Error('Not implemented')
  }

  visibleParams() {
    return slice(this, this.constructor.visibleFields)
  }

  set(propName, value) {
    return this.mappedParams[propName] = value
  }

  static createInstance(...params) {
    const origModel = new this(...params)

    const proxyModel = new Proxy(origModel, {
      get(model, propName) {
        const origVal = model[propName]
        if (origVal !== void 0) {
          return origVal
        }
        
        if (propName in model.mappedParams) {
          return model.mappedParams[propName]
        }

        if (propName in model.params) {
          return model.params[propName]
        }

        return model[propName]
      },

      ownKeys(model) {
        return Object.keys(model.mappedParams).concat(Object.keys(model.params))
      },

      getOwnPropertyDescriptor(model) {
        return {
          enumerable: true,
          configurable: true,
        }
      }
    })

    return proxyModel
  }
}

export default BaseModel
