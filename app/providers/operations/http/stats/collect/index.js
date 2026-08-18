class HttpStatsCollectOperation {
  constructor(statsService) {
    this.statsService = statsService
  }

  async perform(res, payload) {
    const stats = await this.statsService.collectStats()

    return stats
  }
}

export default HttpStatsCollectOperation
