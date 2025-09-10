import crypto from "crypto"

import BaseRepository from "../base.js"

class UserTokenRepository extends BaseRepository {
  async prepareParams(params) {
    params.organization_id = this.castOrganizationId(params.organization_id)
    params.user_id = this.castUserId(params.user_id)

    return await super.prepareParams(params)
  }

  async findToken(jwtToken, deviceId, tokenType) {
    const params = { token: jwtToken }

    deviceId && (params["device_id"] = deviceId)
    tokenType && (params["type"] = tokenType)

    const token = await this.findOne(params)

    return token
  }

  async findTokenByUserId(userId, deviceId, token) {
    const params = { user_id: userId, device_id: deviceId }
    token && (params["token"] = token)

    const record = await this.findOne(params)

    return record
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

  async upsertOTPToken(organizationId, userId, deviceId) {
    const existedToken = await this.findTokenByUserId(userId, deviceId)

    const newOtpToken = crypto.randomInt(100000, 999999)

    const tokenFields = {
      user_id: userId,
      organization_id: organizationId,
      device_id: deviceId,
      type: "otp",
    }

    if (existedToken) {
      await this.updateOne(tokenFields, { $set: { token: newOtpToken, updated_at: new Date() } })

      existedToken.set("token", newOtpToken)

      return existedToken
    } else {
      const newToken = await this.create({
        ...tokenFields,
        token: newOtpToken,
      })

      return newToken
    }
  }

  async deleteByUserId(userId, deviceId) {
    await this.deleteMany({ user_id: userId, device_id: deviceId })
  }
}

export default UserTokenRepository
