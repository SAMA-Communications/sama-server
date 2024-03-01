import BaseModel from './base.js'

import { slice } from '../utils/req_res_utils.js'

export default class User extends BaseModel {
  static get collection() {
    return 'users'
  }

  static get visibleFields() {
    return [
      '_id',

      'created_at',
      'updated_at',
      'recent_activity',

      'first_name',
      'last_name',
      'login',
      'email',
      'phone',
    ]
  }

  static get originalFields() {
    return [
      '_id',

      'created_at',
      'updated_at',
      'recent_activity',

      'first_name',
      'last_name',
      'login',
      'email',
      'phone',

      'encrypted_password',
      'password_salt'
    ]
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
