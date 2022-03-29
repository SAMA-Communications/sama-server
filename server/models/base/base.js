import { getDb } from '../../lib/db.js';
import { slice } from '../../utils/req_res_utils.js';
import User from '../user.js';

export default class BaseModel {
  constructor(params) {
    this.params = params;
    this.hooks = {};
  }

  static get collection() {
    throw new Error('Not implemented');
  } 

  static get visibleFields() {
    throw new Error('Not implemented');
  }

  async save() {
    if (this.hooks.beforeSave) {
      await this.hooks.beforeSave();
    }

    const currentDate = new Date();
    const insertParams = {...this.params, created_at: currentDate, updated_at: currentDate};

    try {
      const result = await getDb().collection(this.constructor.collection).insertOne(insertParams);
      this.params = {_id: result.insertedId, ...insertParams};
    } catch (e) {
      return e;
    }   
  }

  static async findOne(query) {
    const record = await getDb().collection(this.collection).findOne(query);
    const obj = (record ? new this(record) : null);
    return obj; 
  }

  toJSON() {
    return JSON.stringify(this.visibleParams());
  }

  visibleParams() {
    return slice(this.params, this.constructor.visibleFields);
  }
}