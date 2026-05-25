class HttpStatsCollectOperation {
  constructor(statsService) {
    this.statsService = statsService
  }

  async perform(res, payload) {
    const needFormat = payload?.get("format")

    const stats = await this.statsService.collectStats(needFormat)

    return stats
  }
}

export default HttpStatsCollectOperation
