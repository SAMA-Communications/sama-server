class FileCreateOperation {
  constructor(sessionService, storageService) {
    this.sessionService = sessionService
    this.storageService = storageService
  }

  async perform(ws, createFiles) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    const fileUploadInfo = []

    for (const createFile of createFiles) {
      const { file, upload_url } = await this.storageService.createFile(currentUserId, createFile)

      fileUploadInfo.push({ ...file, upload_url })
    }

    return fileUploadInfo
  }
}

export default FileCreateOperation
