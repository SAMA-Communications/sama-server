import BaseModel from './base.js'

class File extends BaseModel {
  static get collection() {
    return 'files'
  }

  static get visibleFields() {
    return [
      '_id',

      'created_at',
      'updated_at',

      'name',
      'size',
      'content_type',
      'object_id'
    ]
  }
}

export default File
