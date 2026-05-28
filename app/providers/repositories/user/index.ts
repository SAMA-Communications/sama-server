import BaseRepository from "../base.js"
import type { UserModelProps } from "../../../models/user.js"
import type { OrganizationNativeId, UserNativeId } from "../../../types/common.js"
import type { ObjectId } from "../../../types/common.js"

type UserSearchOptions = {
  match: string
  ignoreIds?: UserNativeId[]
  timeFromUpdate?: Date | string | number
}

export default class UserRepository extends BaseRepository {
  async prepareParams(params: Record<string, any>): Promise<Record<string, any>> {
    params.organization_id = this.castOrganizationId(params.organization_id)

    return await super.prepareParams(params)
  }

  async findByLogin(organizationId: OrganizationNativeId, login: string): Promise<UserModelProps | null> {
    return await this.findOne<UserModelProps>({ organization_id: organizationId, login })
  }

  async findByEmail(organizationId: OrganizationNativeId, email: string): Promise<UserModelProps | null> {
    return await this.findOne<UserModelProps>({ organization_id: organizationId, email })
  }

  async findWithOrgScopeByIds(organizationId: OrganizationNativeId, ids: UserNativeId[]): Promise<UserModelProps[]> {
    return await this.findAll<UserModelProps>(
      { organization_id: organizationId, _id: { $in: ids } },
      [],
      100,
      { _id: -1 },
    )
  }

  async findRegistered(
    organizationId: OrganizationNativeId,
    login: string,
    email?: string,
    phone?: string,
  ): Promise<UserModelProps | null> {
    const query: Record<string, any>[] = [{ login }]

    if (email) {
      query.push({ email })
    }

    if (phone) {
      query.push({ phone })
    }

    return await this.findOne<UserModelProps>({ organization_id: organizationId, $or: query })
  }

  async retrieveExistedIds(organizationId: OrganizationNativeId, userIds: UserNativeId[]): Promise<ObjectId[]> {
    return await this.getAllIdsBy({ organization_id: organizationId, _id: { $in: userIds } })
  }

  async search(
    organizationId: OrganizationNativeId,
    { match, ignoreIds, timeFromUpdate }: UserSearchOptions,
    limit: number,
  ): Promise<UserModelProps[]> {
    const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regexPattern = new RegExp(`${escapedMatch}.*`, "i")

    const query: Record<string, any> = {
      _id: { $nin: ignoreIds },
      organization_id: organizationId,
      $or: [
        { login: { $regex: regexPattern } },
        { first_name: { $regex: regexPattern } },
        { last_name: { $regex: regexPattern } },
      ],
    }

    if (timeFromUpdate) {
      query.updated_at = { $gt: new Date(timeFromUpdate) }
    }

    return await this.findAll<UserModelProps>(query, null, limit, { first_name: -1, last_name: 1, login: 1 })
  }

  async matchUserContact(
    organizationId: OrganizationNativeId,
    emails: string[],
    phones: string[],
  ): Promise<UserModelProps[]> {
    const orQuery: Record<string, any>[] = []

    if (emails?.length) {
      orQuery.push({ email: { $in: emails } })
    }

    if (phones?.length) {
      orQuery.push({ phone: { $in: phones } })
    }

    return await this.findAll<UserModelProps>({ organization_id: organizationId, $or: orQuery }, null)
  }

  async update(userId: UserNativeId, updateParams: Record<string, any>): Promise<UserModelProps | null> {
    return await this.findOneAndUpdate<UserModelProps>({ _id: userId }, { $set: updateParams })
  }

  async updateActivity(userId: UserNativeId, recentActivity: Date): Promise<void> {
    await this.updateOne({ _id: userId }, { $set: { recent_activity: recentActivity } })
  }
}
