import BaseRepository from '../base.js'

class UserTokenRepository extends BaseRepository {
  async findToken(jwtToken, deviceId) {
    const token = await this.findOne({ token: jwtToken, device_id: deviceId })

    return token
  }

  async findTokenByUserId(userId, deviceId) {
    const token = await this.findOne({ user_id: userId, device_id: deviceId })

    return token
  }

  async updateToken(existedToken, userId, deviceId, jwtToken) {
    if (existedToken) {
      await this.updateOne(
        {
          user_id: existedToken.user_id,
          device_id: deviceId,
        },
        { $set: { token: jwtToken } }
      )

      existedToken.set('token', jwtToken)

      return existedToken
    } else {
      const newToken = await this.create({
        user_id: userId,
        device_id: deviceId,
        token: jwtToken,
      })

      return newToken
    }
  }

  async deleteByUserId(userId, deviceId) {
    await this.deleteMany({ user_id: userId, device_id: deviceId })
  }
}

export default UserTokenRepository