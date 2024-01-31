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

  async updateToken(token, userId, deviceId, jwtToken) {
    if (token) {
      await this.updateOne(
        {
          user_id: token.params.user_id,
          device_id: deviceId,
        },
        { $set: { token: jwtToken } }
      )

      token.params.token = jwtToken
    } else {
      token = await this.create({
        user_id: userId,
        device_id: deviceId,
        token: jwtToken,
      })
    }

    return token
  }
}

export default UserTokenRepository