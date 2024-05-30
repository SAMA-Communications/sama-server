import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class FilesController extends BaseJSONController {
  async create_url(ws, data) {
    const { id: requestId, create_files: reqFiles } = data

    const sessionService = ServiceLocatorContainer.use("SessionService")
    const storageService = ServiceLocatorContainer.use("StorageService")

    const currentUserId = sessionService.getSessionUserId(ws)

    const resFiles = []

    for (const reqFile of reqFiles) {
      const { file, upload_url } = await storageService.createFile(currentUserId, reqFile)

      resFiles.push({ ...file, upload_url })
    }

    return new Response().addBackMessage({ response: { id: requestId, files: resFiles } })
  }

  async get_download_url(ws, data) {
    const {
      id: requestId,
      get_file_urls: { file_ids: objectIds },
    } = data

    const sessionService = ServiceLocatorContainer.use("SessionService")
    const storageService = ServiceLocatorContainer.use("StorageService")

    const currentUserId = sessionService.getSessionUserId(ws)

    const urls = {}

    for (const fileObjectId of objectIds) {
      const downloadUrl = await storageService.downloadFile(currentUserId, fileObjectId)

      urls[fileObjectId] = downloadUrl
    }

    return new Response().addBackMessage({ response: { id: requestId, file_urls: urls } })
  }
}

export default new FilesController()
