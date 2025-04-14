import BaseRepository from "../base.js"

class UserTokenRepository extends BaseRepository {
  async findToken(jwtToken, deviceId, tokenType) {
    const params = { token: jwtToken }

    organizationId && (params["organizationId"] = organizationId)
    deviceId && (params["device_id"] = deviceId)
    tokenType && (params["type"] = tokenType)

    const token = await this.findOne(params)

    return token
  }

  async findTokenByUserId(userId, deviceId, tokenType) {
    const token = await this.findOne({ user_id: userId, device_id: deviceId, token: tokenType })

    return token
  }

  async updateToken(token, organizationId, userId, deviceId, jwtToken, tokenType) {
    const existedToken =
      !token || tokenType !== token.type ? await this.findTokenByUserId(userId, deviceId, tokenType) : token

    if (existedToken) {
      await this.updateOne(
        {
          user_id: existedToken.user_id,
          device_id: deviceId,
          type: tokenType,
        },
        { $set: { token: jwtToken, updated_at: new Date() } }
      )

      existedToken.set("token", jwtToken)

      return existedToken
    } else {
      const newToken = await this.create({
        organization_id: organizationId,
        user_id: userId,
        device_id: deviceId,
        type: tokenType,
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
