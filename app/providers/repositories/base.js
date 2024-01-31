import { ObjectId } from 'mongodb'
 
export default class BaseRepository {
  constructor(dbConnection, Model) {
    this.dbConnection = dbConnection
    this.Model = Model
  }

  get collectionName () {
    return this.Model.collection
  }

  get collectionCursor () {
    return this.dbConnection.collection(this.collectionName)
  }
 
  async prepareParams(params) {
    const currentDate = new Date()

    const insertParams = {
      ...params,
      created_at: currentDate,
      updated_at: currentDate,
    }

    return insertParams
  }

  async create(createParams) {
    const insertParams = await this.prepareParams(createParams)

    const result = await this.collectionCursor.insertOne(insertParams)

    const modelParams = { _id: result.insertedId, ...insertParams }

    const model = new this.Model(modelParams)

    return model
  }

  async createMany(bulkCreateParams) {
    const insertParams = []
    for (const createParams of bulkCreateParams) {
      const insertOneParams = await this.prepareParams(createParams)
      insertParams.push(insertOneParams)
    }

    const result = await this.collectionCursor.insertMany(insertParams)

    const modelParams = insertParams.map((params, index) => ({ _id: result.insertedIds.at(index), ...params }))

    const models = modelParams.map(params => new this.Model(params))

    return models
  }

  async findAll(query, projectionParams, limit, sortParams) {
    if (query.cid) {
      query.cid = new ObjectId(query.cid)
    }
    if (query._id) {
      query._id.$nin &&
        (query._id.$nin = query._id.$nin.map((id) => new ObjectId(id)))
      query._id.$in &&
        (query._id.$in = query._id.$in.map((id) => new ObjectId(id)))
    }
    if (query.user_id && !query.user_id.$ne) {
      query.user_id.$in
        ? (query.user_id.$in = query.user_id.$in.map(
            (id) => new ObjectId(id)
          ))
        : (query.user_id = new ObjectId(query.user_id))
    }
    if (query.conversation_id) {
      query.conversation_id.$in
        ? (query.conversation_id.$in = query.conversation_id.$in.map(
            (id) => new ObjectId(id)
          ))
        : (query.conversation_id = new ObjectId(query.conversation_id))
    }
    if (query.from?.$ne) {
      query.from.$ne = new ObjectId(query.from.$ne)
    }

    const projection = projectionParams?.reduce((acc, p) => {
      return { ...acc, [p]: 1 }
    }, {})

    const records = await this.collectionCursor.find(query, { limit: limit || 100 })
      .project(projection).sort(sortParams || { $natural: -1 }).toArray()

    const models = records.map(record => new this.Model(record))

    return models
  }

  async findOne(query) {
    if (query._id) {
      query._id = new ObjectId(query._id)
    }
    if (query.user_id) {
      query.user_id = new ObjectId(query.user_id)
    }
    if (query.conversation_id) {
      query.conversation_id = new ObjectId(query.conversation_id)
    }

    const record = await this.collectionCursor.findOne(query)

    const model = record ? new this.Model(record) : null

    return model
  }

  async count(query) {
    if (query.conversation_id) {
      query.conversation_id = new ObjectId(query.conversation_id)
    }
    if (query.user_id && !query.user_id.$ne) {
      query.user_id = new ObjectId(query.user_id)
    }
    if (query.user_id?.$ne) {
      query.user_id.$ne = new ObjectId(query.user_id.$ne)
    }
    if (query.from?.$ne) {
      query.from.$ne = new ObjectId(query.from.$ne)
    }

    const count = await this.collectionCursor.count(query)

    return count || 0
  }

  async updateOne(query, update) {
    if (query._id) {
      query._id = new ObjectId(query._id)
    }

    await this.collectionCursor.updateOne(query, update)
  }

  async findOneAndUpdate(query, update) {
    if (query._id) {
      query._id = new ObjectId(query._id)
    }
    if (query.user_id) {
      query.user_id = new ObjectId(query.user_id)
    }

    const record = await this.collectionCursor.findOneAndUpdate(query, update, { returnDocument: 'after' })

    const model = new this.Model(record)

    return model
  }

  async updateMany(query, update) {
    await this.collectionCursor.updateMany(query, update)
  }

  async getAllIdsBy(query) {
    if (query) {
      query._id.$in = query._id.$in.map((id) => new ObjectId(id))
    }

    const records = await this.collectionCursor.find(query).project({ _id: 1 }).toArray()

    return records.map(record => record._id)
  }

  async aggregate(query) {
    const result =  await this.collectionCursor.aggregate(query).toArray()
    
    return result
  }

  async deleteById(_id) {
    await this.dbConnection.collection(this.constructor.collection).deleteOne({ _id })
  }

  async deleteMany(query) {
    await this.collectionCursor.deleteMany(query)
  }
}