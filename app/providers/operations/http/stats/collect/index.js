class HttpStatsCollectOperation {
  constructor(statsService) {
    this.statsService = statsService
  }

  async perform(fakeWsSessionKey, payload) {
    const needFormat = payload?.get("format")

    const stats = await this.statsService.collectStats(needFormat)

    return stats
  }
}

export default HttpStatsCollectOperation
