import { ObjectId } from "mongodb"

export default class BaseRepository {
  constructor(dbConnection, Model, mapper) {
    this.dbConnection = dbConnection
    this.Model = Model
    this.mapper = mapper
  }

  get collectionName() {
    return this.Model.collection
  }

  get collectionCursor() {
    return this.dbConnection.collection(this.collectionName)
  }

  castObjectId(id) {
    try {
      return new ObjectId(id)
    } catch (error) {
      return id
    }
  }

  castObjectIds(ids) {
    return ids.map((id) => this.castObjectId(id))
  }

  castOrganizationId(id) {
    return this.castObjectId(id)
  }

  castUserId(id) {
    return this.castObjectId(id)
  }

  castUserIds(ids) {
    return ids.map((id) => this.castUserId(id))
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
    if (createParams._id) {
      createParams._id = this.castObjectId(createParams._id)
    }

    if (createParams.organization_id) {
      createParams.organization_id = this.castOrganizationId(createParams.organization_id)
    }

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

    const models = modelParams.map((params) => this.wrapRawRecordInModel(params))

    return models
  }

  async bulkUpsert(operations) {
    const updateOneOperations = operations.map(([filter, update]) => ({
      updateOne: { filter, update, upsert: true },
    }))

    const result = await this.collectionCursor.bulkWrite(updateOneOperations)

    return result
  }

  async findById(id) {
    const model = await this.findOne({ _id: id })

    return model
  }

  async findAllByIds(ids, limit = 100) {
    const models = await this.findAll({ _id: { $in: ids } }, null, limit)

    return models
  }

  async findAll(query, projectionParams, limit = 100, sortParams) {
    if (query.cid) {
      query.cid = this.castObjectId(query.cid)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query._id) {
      query._id.$nin && (query._id.$nin = this.castObjectIds(query._id.$nin))
      query._id.$in && (query._id.$in = this.castObjectIds(query._id.$in))
    }
    if (query.user_id && !query.user_id.$ne) {
      query.user_id.$in ? (query.user_id.$in = this.castUserIds(query.user_id.$in)) : (query.user_id = this.castUserId(query.user_id))
    }
    if (query.conversation_id) {
      query.conversation_id.$in
        ? (query.conversation_id.$in = this.castObjectIds(query.conversation_id.$in))
        : (query.conversation_id = this.castObjectId(query.conversation_id))
    }
    if (query.from?.$ne) {
      query.from.$ne = this.castObjectId(query.from.$ne)
    }

    const projection = projectionParams?.reduce((acc, p) => {
      return { ...acc, [p]: 1 }
    }, {})

    const records = await this.collectionCursor
      .find(query, { limit: +limit })
      .project(projection)
      .sort(sortParams || { $natural: -1 })
      .toArray()

    const models = records.map((record) => this.wrapRawRecordInModel(record))

    return models
  }

  async findOne(query) {
    if (query._id) {
      query._id = this.castObjectId(query._id)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.user_id) {
      query.user_id = this.castUserId(query.user_id)
    }
    if (query.conversation_id) {
      query.conversation_id = this.castObjectId(query.conversation_id)
    }

    const record = await this.collectionCursor.findOne(query)

    const model = record ? this.wrapRawRecordInModel(record) : null

    return model
  }

  async count(query) {
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.conversation_id) {
      query.conversation_id = this.castObjectId(query.conversation_id)
    }
    if (query.user_id && !query.user_id.$ne) {
      query.user_id = this.castUserId(query.user_id)
    }
    if (query.user_id?.$ne) {
      query.user_id.$ne = this.castUserId(query.user_id.$ne)
    }
    if (query.from?.$ne) {
      query.from.$ne = this.castUserId(query.from.$ne)
    }

    const count = await this.collectionCursor.count(query)

    return count ?? 0
  }

  async updateOne(query, update, options) {
    if (query._id) {
      query._id = this.castObjectId(query._id)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.conversation_id) {
      query.conversation_id = this.castObjectId(query.conversation_id)
    }

    const result = await this.collectionCursor.updateOne(query, update, options)

    return result
  }

  async findOneAndUpdate(query, update) {
    if (query._id) {
      query._id = this.castObjectId(query._id)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.user_id) {
      query.user_id = this.castUserId(query.user_id)
    }

    const record = await this.collectionCursor.findOneAndUpdate(query, update, { returnDocument: "after" }).catch((error) => null)

    const model = record ? this.wrapRawRecordInModel(record) : null

    return model
  }

  async updateMany(query, update) {
    await this.collectionCursor.updateMany(query, update)
  }

  async getAllIdsBy(query) {
    if (query) {
      query._id.$in = this.castObjectIds(query._id.$in)
    }

    const records = await this.collectionCursor.find(query).project({ _id: 1 }).toArray()

    return records.map((record) => record._id)
  }

  async aggregate(query) {
    const result = await this.collectionCursor.aggregate(query).toArray()

    return result
  }

  async deleteById(_id) {
    return await this.collectionCursor.deleteOne({ _id: this.castObjectId(_id) })
  }

  async deleteByIds(ids) {
    ids = this.castObjectIds(ids)

    return await this.deleteMany({ _id: { $in: ids } })
  }

  async deleteMany(query) {
    if (query._id) {
      if (query._id.$in) {
        query._id.$in = this.castObjectIds(query._id.$in)
      }
      query._id = this.castObjectId(query._id)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.user_id) {
      query.user_id = this.castUserId(query.user_id)
    }

    const result = await this.collectionCursor.deleteMany(query)

    return result
  }

  wrapRawRecordInModel(rawRecord) {
    const { params, mappedParams } = this.mapper.createModelParams(rawRecord)

    return this.Model.createInstance(params, mappedParams)
  }

  mergeOperators(existedOperators = {}, operatorsToAdd) {
    return Object.assign(existedOperators, operatorsToAdd)
  }
}
