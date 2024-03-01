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

  visibleParams(proxyModel) {
    return slice(proxyModel, this.constructor.visibleFields)
  }

  static createInstance(...params) {
    const origModel = new this(...params)

    const proxyModel = new Proxy(origModel, {
      get(model, propName) {
        if (propName in model.mappedParams) {
          return model.mappedParams[propName]
        }

        if (propName in model.params) {
          return model.params[propName]
        }

        const prop = model[propName]

        if (typeof prop === 'function') {
          return prop.bind(model, proxyModel)
        }

        return prop
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
