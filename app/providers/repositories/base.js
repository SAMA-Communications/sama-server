import { ObjectId } from 'mongodb'
 
export default class BaseRepository {
  constructor(dbConnection, Model, mapper) {
    this.dbConnection = dbConnection
    this.Model = Model
    this.mapper = mapper
  }

  get collectionName () {
    return this.Model.collection
  }

  get collectionCursor () {
    return this.dbConnection.collection(this.collectionName)
  }

  safeWrapOId(val) {
    try {
      return new ObjectId(val)
    } catch (error) {
      return val
    }
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

    const model = this.wrapRawRecordInModel(modelParams)

    return model
  }

  async createMany(bulkCreateParams) {
    const insertParams = []
    for (const createParams of bulkCreateParams) {
      const insertOneParams = await this.prepareParams(createParams)
      insertParams.push(insertOneParams)
    }

    const result = await this.collectionCursor.insertMany(insertParams)

    const modelParams = insertParams.map((params, index) => ({ _id: result.insertedIds[index], ...params }))

    const models = modelParams.map(params => this.wrapRawRecordInModel(params))

    return models
  }

  async findById(id) {
    const model = await this.findOne({ _id: id })

    return model
  }

  async findAllByIds(ids) {
    const models = await this.findAll({ _id: { $in: ids } })

    return models
  }

  async findAll(query, projectionParams, limit, sortParams) {
    if (query.cid) {
      query.cid = this.safeWrapOId(query.cid)
    }
    if (query._id) {
      query._id.$nin &&
        (query._id.$nin = query._id.$nin.map((id) => this.safeWrapOId(id)))
      query._id.$in &&
        (query._id.$in = query._id.$in.map((id) => this.safeWrapOId(id)))
    }
    if (query.user_id && !query.user_id.$ne) {
      query.user_id.$in
        ? (query.user_id.$in = query.user_id.$in.map(
            (id) => this.safeWrapOId(id)
          ))
        : (query.user_id = this.safeWrapOId(query.user_id))
    }
    if (query.conversation_id) {
      query.conversation_id.$in
        ? (query.conversation_id.$in = query.conversation_id.$in.map(
            (id) => this.safeWrapOId(id)
          ))
        : (query.conversation_id = this.safeWrapOId(query.conversation_id))
    }
    if (query.from?.$ne) {
      query.from.$ne = this.safeWrapOId(query.from.$ne)
    }

    const projection = projectionParams?.reduce((acc, p) => {
      return { ...acc, [p]: 1 }
    }, {})

    const records = await this.collectionCursor.find(query, { limit: limit || 100 })
      .project(projection).sort(sortParams || { $natural: -1 }).toArray()

    const models = records.map(record => this.wrapRawRecordInModel(record))

    return models
  }

  async findOne(query) {
    if (query._id) {
      query._id = this.safeWrapOId(query._id)
    }
    if (query.user_id) {
      query.user_id = this.safeWrapOId(query.user_id)
    }
    if (query.conversation_id) {
      query.conversation_id = this.safeWrapOId(query.conversation_id)
    }

    const record = await this.collectionCursor.findOne(query)

    const model = record ? this.wrapRawRecordInModel(record) : null

    return model
  }

  async count(query) {
    if (query.conversation_id) {
      query.conversation_id = this.safeWrapOId(query.conversation_id)
    }
    if (query.user_id && !query.user_id.$ne) {
      query.user_id = this.safeWrapOId(query.user_id)
    }
    if (query.user_id?.$ne) {
      query.user_id.$ne = this.safeWrapOId(query.user_id.$ne)
    }
    if (query.from?.$ne) {
      query.from.$ne = this.safeWrapOId(query.from.$ne)
    }

    const count = await this.collectionCursor.count(query)

    return count || 0
  }

  async updateOne(query, update) {
    if (query._id) {
      query._id = this.safeWrapOId(query._id)
    }

    await this.collectionCursor.updateOne(query, update)
  }

  async findOneAndUpdate(query, update) {
    if (query._id) {
      query._id = this.safeWrapOId(query._id)
    }
    if (query.user_id) {
      query.user_id = this.safeWrapOId(query.user_id)
    }

    const record = await this.collectionCursor.findOneAndUpdate(query, update, { returnDocument: 'after' }).catch(error => error)

    const model = record.ok ? this.wrapRawRecordInModel(record.value) : null

    return model
  }

  async updateMany(query, update) {
    await this.collectionCursor.updateMany(query, update)
  }

  async getAllIdsBy(query) {
    if (query) {
      query._id.$in = query._id.$in.map((id) => this.safeWrapOId(id))
    }

    const records = await this.collectionCursor.find(query).project({ _id: 1 }).toArray()

    return records.map(record => record._id)
  }

  async aggregate(query) {
    const result =  await this.collectionCursor.aggregate(query).toArray()
    
    return result
  }

  async deleteById(_id) {
    await this.collectionCursor.deleteOne({ _id: this.safeWrapOId(_id) })
  }

  async deleteByIds(ids) {
    ids = ids.map(id => this.safeWrapOId(id))

    await this.deleteMany({ _id: { $in: ids } })
  }

  async deleteMany(query) {
    await this.collectionCursor.deleteMany(query)
  }

  wrapRawRecordInModel(rawRecord) {
    const { params, mappedParams } = this.mapper.createModelParams(rawRecord)

    return this.Model.createInstance(params, mappedParams)
  }

  mergeOperators(existedOperators = {}, operatorsToAdd) {
    return Object.assign(existedOperators, operatorsToAdd)
  }
}