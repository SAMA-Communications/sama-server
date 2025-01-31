import BaseRepository from "../base.js"

class ClusterNodeRepository extends BaseRepository {
  async updateStats(_id, stats) {
    await this.updateOne({ _id }, { $set: { ...stats } })
  }
}

export default ClusterNodeRepository
