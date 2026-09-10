class HttpStatsCollectOperation {
  constructor(statsService) {
    this.statsService = statsService
  }

  async perform(res, payload, onlyServer = false) {
    const stats = onlyServer ? await this.statsService.collectServerStats() : await this.statsService.collectStats()

    return stats
  }
}

export default HttpStatsCollectOperation
