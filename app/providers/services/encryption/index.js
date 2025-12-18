class EncryptionService {
  constructor(encryptionRepo) {
    this.encryptionRepo = encryptionRepo
  }

  async update(existDevice, updateParams) {
    const updatedDevice = await this.encryptionRepo.update(existDevice._id, updateParams)

    return updatedDevice
  }

  async removeFirstOneTimeKey(devicesByUser) {
    const devicesIdenityKeys = []
    Object.values(devicesByUser).forEach((devices) =>
      devices.forEach((device) => devicesIdenityKeys.push(device.identity_key))
    )

    const devices = await this.encryptionRepo.findAll({ identity_key: { $in: devicesIdenityKeys } })

    for (const device of devices) {
      const firstKey = Object.keys(device.one_time_pre_keys)[0]
      await this.encryptionRepo.updateMany({ _id: device._id }, { $unset: { [`one_time_pre_keys.${firstKey}`]: "" } })
    }
  }
}

export default EncryptionService
