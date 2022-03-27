import { getDb } from '../../lib/db.js';

export default class BaseModel {
  static get collection() {
    throw new Error('Not implemented');
  } 

  static get ALLOWED_API_REQ_FIELDS() {
    throw new Error('Not implemented');
  }
}