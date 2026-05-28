import {
  ObjectId,
  type BulkWriteResult,
  type Collection,
  type Db,
  type DeleteResult,
  type Document,
  type Filter,
  type Sort,
  type UpdateFilter,
  type UpdateOptions,
  type UpdateResult,
  type WithId,
} from "mongodb"

import type BaseModel from "../../models/base.js"

type MongoDbConnection = Db
type RepositoryQuery = {
  // _id: ObjectIdNotCasted | any,
  // $in: ObjectIdNotCasted[],
  // $nin: ObjectIdNotCasted[],
  [key: string]: any
}
type Model = typeof BaseModel
type ObjectIdNotCasted = ObjectId | string


export default class BaseRepository {
  dbConnection: MongoDbConnection
  Model: Model
  mapper: any

  constructor(dbConnection: MongoDbConnection, Model: Model, mapper: any) {
    this.dbConnection = dbConnection
    this.Model = Model
    this.mapper = mapper
  }

  get collectionName(): string {
    return this.Model.collection
  }

  get collectionCursor(): Collection<Document> {
    return this.dbConnection.collection(this.collectionName)
  }

  castObjectId(id: ObjectIdNotCasted): ObjectId {
    try {
      return new ObjectId(id)
    } catch {
      return id as unknown as ObjectId
    }
  }

  castObjectIds(ids: ObjectIdNotCasted[]): ObjectId[] {
    return ids.map((id) => this.castObjectId(id))
  }

  castOrganizationId(id: ObjectIdNotCasted): ObjectId {
    return this.castObjectId(id)
  }

  castUserId(id: ObjectIdNotCasted): ObjectId {
    return this.castObjectId(id)
  }

  castUserIds(ids: ObjectIdNotCasted[]): ObjectId[] {
    return ids.map((id) => this.castUserId(id))
  }

  async prepareParams(params: Record<string, any>): Promise<Record<string, any>> {
    const currentDate = new Date()

    return {
      ...params,
      created_at: currentDate,
      updated_at: currentDate,
    }
  }

  async create<TModel>(createParams: Record<string, any>): Promise<TModel> {
    if (createParams._id) {
      createParams._id = this.castObjectId(createParams._id)
    }

    if (createParams.organization_id) {
      createParams.organization_id = this.castOrganizationId(createParams.organization_id)
    }

    const insertParams = await this.prepareParams(createParams)

    const result = await this.collectionCursor.insertOne(insertParams)

    const modelParams = { _id: result.insertedId, ...insertParams }

    return this.wrapRawRecordInModel(modelParams)
  }

  async createMany<TModel>(bulkCreateParams: Record<string, any>[]): Promise<TModel[]> {
    const insertParams: Record<string, any>[] = []
    for (const createParams of bulkCreateParams) {
      const insertOneParams = await this.prepareParams(createParams)
      insertParams.push(insertOneParams)
    }

    const result = await this.collectionCursor.insertMany(insertParams)

    const modelParams = insertParams.map((params, index) => ({
      _id: result.insertedIds[index],
      ...params,
    }))

    return modelParams.map((params) => this.wrapRawRecordInModel<TModel>(params))
  }

  async bulkUpsert(operations: [RepositoryQuery, UpdateFilter<Document>][]): Promise<BulkWriteResult> {
    const updateOneOperations = operations.map(([filter, update]) => ({
      updateOne: { filter, update, upsert: true },
    }))

    return await this.collectionCursor.bulkWrite(updateOneOperations)
  }

  async findById<TModel>(id: ObjectIdNotCasted): Promise<TModel | null> {
    return await this.findOne({ _id: id })
  }

  async findAllByIds<TModel>(ids: ObjectIdNotCasted[], limit = 100): Promise<TModel[]> {
    return await this.findAll({ _id: { $in: ids } } as RepositoryQuery, null, limit)
  }

  async findAll<TModel>(
    query: RepositoryQuery,
    projectionParams: string[] | null,
    limit = 100,
    sortParams?: Sort,
  ): Promise<TModel[]> {
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
      .find(query)
      .project(projection)
      .sort(sortParams ?? {})
      .limit(limit)
      .toArray()

    return records.map((record) => this.wrapRawRecordInModel(record))
  }

  async findOne<TModel>(query: RepositoryQuery): Promise<TModel | null> {
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

    return record ? this.wrapRawRecordInModel(record) : null
  }

  async count(query: RepositoryQuery): Promise<number> {
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

    const count = await this.collectionCursor.countDocuments(query)

    return count ?? 0
  }

  async updateOne(query: RepositoryQuery, update: UpdateFilter<Document>, options?: UpdateOptions): Promise<UpdateResult> {
    if (query._id) {
      query._id = this.castObjectId(query._id)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.conversation_id) {
      query.conversation_id = this.castObjectId(query.conversation_id)
    }

    return await this.collectionCursor.updateOne(query, update, options)
  }

  async findOneAndUpdate<TModel>(query: RepositoryQuery, update: UpdateFilter<Document>): Promise<TModel | null> {
    if (query._id) {
      query._id = this.castObjectId(query._id)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.user_id) {
      query.user_id = this.castUserId(query.user_id)
    }

    const record = await this.collectionCursor
      .findOneAndUpdate(query, update, { returnDocument: "after" })
      .catch(() => null)

    return record ? this.wrapRawRecordInModel(record) : null
  }

  async updateMany(query: RepositoryQuery, update: UpdateFilter<Document>): Promise<void> {
    if (query.user_id) {
      if (query.user_id.$in) {
        query.user_id.$in = this.castUserIds(query.user_id.$in)
      }
      query.user_id = this.castUserId(query.user_id)
    }

    await this.collectionCursor.updateMany(query, update)
  }

  async getAllIdsBy(query: RepositoryQuery): Promise<ObjectId[]> {
    if (query) {
      query._id.$in = this.castObjectIds(query._id.$in)
    }

    const records = await this.collectionCursor.find(query).project({ _id: 1 }).toArray()

    return records.map((record) => record._id as ObjectId)
  }

  async aggregate(query: Document[]): Promise<Document[]> {
    return await this.collectionCursor.aggregate(query).toArray()
  }

  async deleteById(_id: ObjectIdNotCasted): Promise<DeleteResult> {
    return await this.collectionCursor.deleteOne({ _id: this.castObjectId(_id) })
  }

  async deleteByIds(ids: ObjectIdNotCasted[]): Promise<DeleteResult> {
    const castedIds = this.castObjectIds(ids)

    const query = { _id: { $in: castedIds } }

    return await this.deleteMany(query)
  }

  async deleteMany(query: RepositoryQuery): Promise<DeleteResult> {
    if (query._id) {
      if (query.$in) {
        query.$in = this.castObjectIds(query.$in)
      }
      query._id = this.castObjectId(query._id)
    }
    if (query.organization_id) {
      query.organization_id = this.castOrganizationId(query.organization_id)
    }
    if (query.user_id) {
      query.user_id = this.castUserId(query.user_id)
    }

    return await this.collectionCursor.deleteMany(query as Filter<Document>)
  }

  wrapRawRecordInModel<TModel>(rawRecord: WithId<Document> | Record<string, any>): TModel {
    const { params, mappedParams } = this.mapper.createModelParams(rawRecord)

    return this.Model.createInstance<TModel>(params, mappedParams)
  }

  mergeOperators(existedOperators: Record<string, any> = {}, operatorsToAdd: Record<string, any>): Record<string, any> {
    return Object.assign(existedOperators, operatorsToAdd)
  }
}
