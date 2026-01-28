class LastActivityStatusResponse {
  orgId = null
  userId = null
  status = null

  constructor(orgId, userId, status) {
    this.orgId = orgId
    this.userId = userId
    this.status = status
  }
}

export default LastActivityStatusResponse
