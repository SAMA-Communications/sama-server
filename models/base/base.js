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

  static async insertArray(data) {
    try {
      const bulk = getDb()
        .collection(this.collection)
        .initializeUnorderedBulkOp();
      data.forEach((item) => bulk.insert(item));
      bulk.execute();
    } catch (e) {
      return e;
    }
  }

  static async findAll(query, returnParams, limit) {
    try {
      if (query.cid) {
        query.cid = new ObjectId(query.cid);
      }
      if (query._id?.$nin) {
        for (let i = 0; i < query._id.$nin.length; i++) {
          query._id.$nin[i] = new ObjectId(query._id.$nin[i]);
        }
      }
      if (query.user_id && !query.user_id.$ne) {
        query.user_id = new ObjectId(query.user_id);
      }
      if (query.conversation_id) {
        query.conversation_id.$in
          ? (query.conversation_id.$in = query.conversation_id.$in.map(
              (id) => new ObjectId(id)
            ))
          : (query.conversation_id = new ObjectId(query.conversation_id));
      }
      if (query.from?.$ne) {
        query.from.$ne = new ObjectId(query.from.$ne);
      }

      const projection = returnParams?.reduce((acc, p) => {
        return { ...acc, [p]: 1 };
      }, {});

      return await getDb()
        .collection(this.collection)
        .find(query, { limit: limit || 100 })
        .project(projection)
        .sort({ $natural: -1 })
        .toArray();
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

  static async clearCollection() {
    try {
      await getDb().collection(this.collection).deleteMany({});
    } catch (e) {
      return null;
    }
  }

  static async count(query) {
    try {
      if (query.conversation_id) {
        query.conversation_id = new ObjectId(query.conversation_id);
      }
      if (query.user_id && !query.user_id.$ne) {
        query.user_id = new ObjectId(query.user_id);
      }
      if (query.user_id?.$ne) {
        query.user_id.$ne = new ObjectId(query.user_id.$ne);
      }
      if (query.from?.$ne) {
        query.from.$ne = new ObjectId(query.from.$ne);
      }
      return await getDb().collection(this.collection).count(query);
    } catch (e) {
      return null;
    }
  }

  static async updateOne(query, update) {
    try {
      if (query._id) {
        query._id = new ObjectId(query._id);
      }
      await getDb().collection(this.collection).updateOne(query, update);
    } catch (e) {
      return null;
    }
  }

  static async updateMany(query, update) {
    try {
      await getDb().collection(this.collection).updateMany(query, update);
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

  static async aggregate(query) {
    try {
      return await getDb()
        .collection(this.collection)
        .aggregate(query)
        .toArray();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async delete() {
    await getDb()
      .collection(this.constructor.collection)
      .deleteOne({ _id: this.params._id });
  }

  static async deleteMany(query) {
    try {
      return await getDb().collection(this.collection).deleteMany(query);
    } catch (e) {
      return null;
    }
  }

  toJSON() {
    return JSON.stringify(this.visibleParams());
  }

  visibleParams() {
    return slice(this.params, this.constructor.visibleFields);
  }
}
