import { ERROR_STATUES } from "../../../constants/errors.js"
import { hashPassword, verifyPassword, type HashedPassword } from "../../../utils/crypto_utils.js"
import type { OrganizationNativeId, UserNativeId } from "../../../types/common.js"
import type { UserModelProps } from "../../../models/user.js"
import type UserRepository from "../../repositories/user/index.js"

type UserCreateParams = Record<string, any> & {
  password?: string
}

type UserUpdateParams = Record<string, any> & {
  current_password?: string
  new_password?: string
}

export default class UserService {
  userRepo: UserRepository
  storageService: any

  constructor(userRepo: UserRepository, storageService: any) {
    this.userRepo = userRepo
    this.storageService = storageService
  }

  async findByLogin(organizationId: OrganizationNativeId, login: string): Promise<UserModelProps | null> {
    return await this.userRepo.findByLogin(organizationId, login)
  }

  async findUsersByIds(organizationId: OrganizationNativeId, userIds: UserNativeId[]): Promise<UserModelProps[]> {
    return await this.userRepo.findWithOrgScopeByIds(organizationId, userIds)
  }

  async findByEmail(organizationId: OrganizationNativeId, email: string): Promise<UserModelProps | null> {
    return await this.userRepo.findByEmail(organizationId, email)
  }

  async create(createParams: UserCreateParams): Promise<UserModelProps> {
    const { password, ...newUserParams } = createParams

    if (password) {
      const { encryptedPassword, salt } = await this.encryptAndSetPassword(password)

      newUserParams.password_salt = salt
      newUserParams.encrypted_password = encryptedPassword
    }

    newUserParams.recent_activity = Math.round(Date.now() / 1000)

    return await this.userRepo.create<UserModelProps>(newUserParams)
  }

  async update(user: UserModelProps, updateParams: UserUpdateParams): Promise<UserModelProps> {
    const { current_password, new_password, ...updateFieldsParams } = updateParams

    if (new_password) {
      if (!current_password || !(await this.validatePassword(user, current_password))) {
        throw new Error(ERROR_STATUES.INCORRECT_CURRENT_PASSWORD.message, {
          cause: ERROR_STATUES.INCORRECT_CURRENT_PASSWORD,
        })
      }

      const { encryptedPassword, salt } = await this.encryptAndSetPassword(new_password)

      updateFieldsParams.password_salt = salt
      updateFieldsParams.encrypted_password = encryptedPassword
    }

    updateFieldsParams.updated_at = new Date()

    const updatedUser = await this.userRepo.update(user.native_id, updateFieldsParams)

    if (!updatedUser) {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      })
    }

    return updatedUser
  }

  async addAvatarUrl(users: UserModelProps[]): Promise<UserModelProps[]> {
    const avatarUrlPromises = users.map(async (user) => {
      if (user.params.avatar_object) {
        user.params.avatar_url = await this.storageService
          .getFileDownloadUrl(user.organization_id, user.params.avatar_object.file_id)
          .catch(() => null)
      }

      return user
    })

    return await Promise.all(avatarUrlPromises)
  }

  async updatePassword(userId: UserNativeId, newPassword: string): Promise<UserModelProps | null> {
    const { encryptedPassword, salt } = await this.encryptAndSetPassword(newPassword)

    const updateFieldsParams = { password_salt: salt, encrypted_password: encryptedPassword }

    return await this.userRepo.update(userId, updateFieldsParams)
  }

  async updateActivity(userId: UserNativeId, recentActivity: Date): Promise<void> {
    await this.userRepo.updateActivity(userId, recentActivity)
  }

  async encryptAndSetPassword(plainPassword: string): Promise<HashedPassword> {
    return await hashPassword(plainPassword)
  }

  async validatePassword(user: UserModelProps, plainPassword: string): Promise<boolean> {
    const passwordSalt = user.params.password_salt
    const passwordEncrypted = user.params.encrypted_password

    return await verifyPassword(plainPassword, passwordEncrypted, passwordSalt)
  }
}
