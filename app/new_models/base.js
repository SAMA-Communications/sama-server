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
    return slice(this.params, this.constructor.visibleFields)
  }

  static createInstance(...params) {
    const origModel = new this(...params)

    return origModel
  }
}

export default BaseModel
