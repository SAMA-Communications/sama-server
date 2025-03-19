import BaseModel from "./base.js"

export default class ClusterNode extends BaseModel {
  static get collection() {
    return "cluster_nodes"
  }

  static get visibleFields() {
    return ["_id", "ip_address", "hostname", "port", "users_count", "created_at", "updated_at"]
  }
}
