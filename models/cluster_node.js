import BaseModel from "./base/base.js";

export default class ClusterNode extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "cluster_nodes";
  }

  static get visibleFields() {
    return [
      "_id",
      "created_at",
      "updated_at",
      "ip_address",
      "hostname",
      "port",
    ];
  }
}
