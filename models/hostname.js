import BaseModel from "./base/base.js";

export default class HostNmae extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "hostname";
  }

  static get visibleFields() {
    return ["_id", "created_at", "updated_at", "ip_address", "hostname"];
  }
}
