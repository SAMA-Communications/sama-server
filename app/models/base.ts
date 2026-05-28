import { slice } from "../utils/req_res_utils.js"

export type BaseModelProps = {
  params: { [key: string]: any },
  mappedParams: { [key: string]: any },
  visibleParams(): Record<string, unknown>
}

class BaseModel {
  params: any
  mappedParams: any

  constructor(params?: any, mappedParams?: any) {
    this.params = params ?? {}
    this.mappedParams = mappedParams ?? {}
  }

  static get collection(): string {
    throw new Error("Not implemented")
  }

  static get visibleFields(): string[] {
    throw new Error("Not implemented")
  }

  static get originalFields(): string[] {
    throw new Error("Not implemented")
  }

  visibleParams(): Record<string, unknown> {
    const Model = this.constructor as typeof BaseModel
    return slice(this as Record<string, unknown>, Model.visibleFields)
  }

  set(propName: string, value: any): any {
    return (this.mappedParams[propName] = value)
  }

  static createInstance<TModel>(params: any, mappedParams: any): TModel {
    const origModel = new this(params, mappedParams)

    const proxyModel = new Proxy(origModel, {
      get(model, propName: string | symbol) {
        if (typeof propName === "symbol") {
          return Reflect.get(model, propName)
        }

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
        const keys = Object.keys(model.mappedParams).concat(Object.keys(model.params))
        return [...new Set(keys)]
      },

      getOwnPropertyDescriptor() {
        return {
          enumerable: true,
          configurable: true,
        }
      },
    })

    return proxyModel as unknown as TModel
  }
}

export default BaseModel
