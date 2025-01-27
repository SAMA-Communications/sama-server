class FileDownloadOperation {
  constructor(sessionService, storageService) {
    this.sessionService = sessionService
    this.storageService = storageService
  }

  async perform(ws, files) {
    const { file_ids: objectIds } = files

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const downloadUrls = {}

    for (const fileObjectId of objectIds) {
      const downloadUrl = await this.storageService.getFileDownloadUrl(currentUserId, fileObjectId)

      downloadUrls[fileObjectId] = downloadUrl
    }

    return downloadUrls
  }
}

export default FileDownloadOperation
