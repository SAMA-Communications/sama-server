import { getDb, ObjectId } from "../../lib/db.js";
import { slice } from "../../utils/req_res_utils.js";

export default class BaseModel {
  constructor(params) {
    this.params = params;
    this.hooks = {};
  }

  static get collection() {
    throw new Error("Not implemented");
  }

  static get visibleFields() {
    throw new Error("Not implemented");
  }

  async save() {
    if (this.hooks.beforeSave) {
      await this.hooks.beforeSave();
    }

    const currentDate = new Date();
    const insertParams = {
      ...this.params,
      created_at: currentDate,
      updated_at: currentDate,
    };

    try {
      const result = await getDb()
        .collection(this.constructor.collection)
        .insertOne(insertParams);
      this.params = { _id: result.insertedId, ...insertParams };
    } catch (e) {
      return e;
    }
  }

  static async findAll(query, returnParam, limit) {
    try {
      const arr = new Set();
      await getDb()
        .collection(this.collection)
        .find(query, { limit: limit })
        .forEach((el) => {
          arr.add(returnParam ? el[returnParam] : el);
        });
      return Array.from(arr);
    } catch (e) {
      return null;
    }
  }

  static async findOne(query) {
    try {
      if (query._id) {
        query._id = new ObjectId(query._id);
      }
      if (query.user_id) {
        query.user_id = new ObjectId(query.user_id);
      }
      if (query.conversation_id) {
        query.conversation_id = new ObjectId(query.conversation_id);
      }

      const record = await getDb().collection(this.collection).findOne(query);
      const obj = record ? new this(record) : null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  static async update(query, update) {
    try {
      if (query._id) {
        query._id = new ObjectId(query._id);
      }
      await getDb().collection(this.collection).updateOne(query, update);
    } catch (e) {
      return null;
    }
  }

  static async getAllIdsBy(query) {
    try {
      if (query) {
        for (let i = 0; i < query._id.$in.length; i++) {
          query._id.$in[i] = new ObjectId(query._id.$in[i]);
        }
      }
      const obj = [];
      await getDb()
        .collection(this.collection)
        .find(query)
        .project({ _id: 1 })
        .forEach((el) => {
          obj.push(el._id);
        });
      return obj;
    } catch (e) {
      return null;
    }
  }

  async delete() {
    await getDb()
      .collection(this.constructor.collection)
      .deleteOne({ _id: this.params._id });
  }

  toJSON() {
    return JSON.stringify(this.visibleParams());
  }

  visibleParams() {
    return slice(this.params, this.constructor.visibleFields);
  }
}
