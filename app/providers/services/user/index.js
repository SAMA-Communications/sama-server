import { hashPassword, verifyPassword } from '../../../utils/crypto_utils.js'

class UserService {
  constructor(userRepo) {
    this.userRepo = userRepo
  }

  async findByLogin(userInfo) {
    const user = await this.userRepo.findByLogin(userInfo.login)

    return user
  }

  async updateActivity(userId, reactActivity) {
    await this.userRepo.updateActivity(userId, reactActivity)
  }
 
  async validatePassword(user, plainPassword) {
    const passwordSalt = user.params.password_salt
    const passwordEncrypted = user.params.encrypted_password

    const isSame = await verifyPassword(
      plainPassword,
      passwordEncrypted,
      passwordSalt
    )

    return isSame
  }
}

export default UserService