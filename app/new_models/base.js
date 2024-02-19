import { slice } from '../utils/req_res_utils.js'

class BaseModel {
  constructor(params) {
    this.params = params
  }

  static get collection() {
    throw new Error('Not implemented')
  }

  static get visibleFields() {
    throw new Error('Not implemented')
  }

  static get hiddenFields() {
    return []
  }

  toJSON() {
    return JSON.stringify(this.visibleParams())
  }

  visibleParams() {
    return slice(this.params, this.constructor.visibleFields)
  }
}

export default BaseModel
