import BaseModel from './base/base.js'

export default class File extends BaseModel {
  constructor(params) {
    super(params)
  }

  static get collection() {
    return 'files'
  }

  static get visibleFields() {
    return ['_id', 'name', 'size', 'content_type', 'object_id']
  }
}
