class MappableMessage {
  packet = null
  mapFunction = (mapper) => this.packet

  constructor(packet, mapFunction) {
    this.packet = packet
    this.mapFunction = mapFunction.bind(this)
  }

  async mapMessage(mapper) {
    this.packet = await this.mapFunction(mapper)
    return this.packet
  }
}

export default MappableMessage