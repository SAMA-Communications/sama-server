import { ERROR_STATUES } from "../../../constants/errors.js"
import { hashPassword, verifyPassword } from "../../../utils/crypto_utils.js"

class UserService {
  constructor(userRepo, storageService) {
    this.userRepo = userRepo
    this.storageService = storageService
  }

  async findByLogin(organizationId, login) {
    const user = await this.userRepo.findByLogin(organizationId, login)

    return user
  }

  async create(createParams) {
    const { password, ...newUserParams } = createParams

    if (password) {
      const { encryptedPassword, salt } = await this.encryptAndSetPassword(password)

      newUserParams["password_salt"] = salt
      newUserParams["encrypted_password"] = encryptedPassword
    }

    newUserParams["recent_activity"] = Math.round(Date.now() / 1000)

    const user = await this.userRepo.create(newUserParams)

    return user
  }

  async update(user, updateParams) {
    const { current_password, new_password, ...updateFieldsParams } = updateParams

    if (new_password) {
      if (!current_password || !(await this.validatePassword(user, current_password))) {
        throw new Error(ERROR_STATUES.INCORRECT_CURRENT_PASSWORD.message, {
          cause: ERROR_STATUES.INCORRECT_CURRENT_PASSWORD,
        })
      }

      const { encryptedPassword, salt } = await this.encryptAndSetPassword(new_password)

      updateFieldsParams["password_salt"] = salt
      updateFieldsParams["encrypted_password"] = encryptedPassword
    }

    updateFieldsParams["updated_at"] = new Date()

    const updatedUser = await this.userRepo.update(user.native_id, updateFieldsParams)

    if (!updatedUser) {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      })
    }

    return updatedUser
  }

  async addAvatarUrl(users) {
    const avatarUrlPromises = users.map(async (user) => {
      if (user.params.avatar_object) {
        user.params.avatar_url = await this.storageService
          .getFileDownloadUrl(user.organization_id, user.avatar_object.file_id)
          .catch((error) => null)
      }

      return user
    })

    return await Promise.all(avatarUrlPromises)
  }

  async updateActivity(userId, reactActivity) {
    await this.userRepo.updateActivity(userId, reactActivity)
  }

  async encryptAndSetPassword(plainPassword) {
    const { encryptedPassword, salt } = await hashPassword(plainPassword)

    return { encryptedPassword, salt }
  }

  async validatePassword(user, plainPassword) {
    const passwordSalt = user.params.password_salt
    const passwordEncrypted = user.params.encrypted_password

    const isSame = await verifyPassword(plainPassword, passwordEncrypted, passwordSalt)

    return isSame
  }
}

export default UserService
