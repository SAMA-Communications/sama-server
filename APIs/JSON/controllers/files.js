import BaseJSONController from './base.js'

import RuntimeDefinedContext from '@sama/store/RuntimeDefinedContext.js'

import File from '@sama/models/file.js'

import Response from '@sama/networking/models/Response.js'

class FilesController extends BaseJSONController {
  async create_url(ws, data) {
    const { id: requestId, create_files: reqFiles } = data

    const resFiles = []

    for (const reqFile of reqFiles) {
      //TODO: update from many to one request if it possible
      const { objectId, url } = await RuntimeDefinedContext.STORAGE_DRIVER.getUploadUrl(
        reqFile.name
      )
      reqFile['object_id'] = objectId

      const file = new File(reqFile)
      await file.save()

      resFiles.push({ ...file.visibleParams(), upload_url: url })
    }

    return new Response().addBackMessage({ response: { id: requestId, files: resFiles } })
  }

  async get_download_url(ws, data) {
    const {
      id: requestId,
      get_file_urls: { file_ids: objectIds },
    } = data

    let urls = {}

    for (const objectId of objectIds) {
      //TODO: update from many to one request if it possible
      const fileUrl = await RuntimeDefinedContext.STORAGE_DRIVER.getDownloadUrl(
        objectId
      )
      urls[objectId] = fileUrl
    }

    return new Response().addBackMessage({ response: { id: requestId, file_urls: urls } })
  }
}

export default new FilesController()
