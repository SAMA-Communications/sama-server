import { getDb } from '../../lib/db.js';
import { slice } from '../../utils/req_res_utils.js';

export default class BaseModel {
  constructor(params) {
    this.params = params;
    this.hooks = {};
  }

  get collection() {
    throw new Error('Not implemented');
  } 

  get visibleFields() {
    throw new Error('Not implemented');
  }

  async save() {
    return new Promise(async (resolve, reject) => {

      if (this.hooks.beforeSave) {
        await this.hooks.beforeSave();
      }

      const currentDate = new Date();
      const insertParams = {...this.params, created_at: currentDate, updated_at: currentDate};

      getDb().collection(this.collection).insertOne(insertParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          this.params = {_id: result.insertedId, ...insertParams};
          resolve();
        }
      });
    });
  }

  toJSON() {
    return JSON.stringify(slice(this.params, this.visibleFields));
  }
}