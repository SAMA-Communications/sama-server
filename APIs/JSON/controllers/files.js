import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class FilesController extends BaseJSONController {
  async create_url(ws, data) {
    const { id: requestId, create_files } = data

    const fileCreateOperation = ServiceLocatorContainer.use("FileCreateOperation")

    const createdFiles = await fileCreateOperation.perform(ws, create_files)

    return new Response().addBackMessage({ response: { id: requestId, files: createdFiles } })
  }

  async get_download_url(ws, data) {
    const { id: requestId, get_file_urls } = data

    const fileDownloadOperation = ServiceLocatorContainer.use("FileDownloadOperation")

    const downloadUrls = await fileDownloadOperation.perform(ws, get_file_urls)

    return new Response().addBackMessage({ response: { id: requestId, file_urls: downloadUrls } })
  }
}

export default new FilesController()
