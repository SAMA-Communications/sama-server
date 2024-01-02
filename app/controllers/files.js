import BaseController from "./base/base.js";
import File from "./../models/file.js";
import FileRepository from "../repositories/file_repository.js";

class FilesController extends BaseController {
  constructor() {
    super();
    this.fileRepository = new FileRepository();
  }

  async create_url(ws, data) {
    const { id: requestId, create_files: reqFiles } = data;

    const resFiles = [];
    for (let i = 0; i < reqFiles.length; i++) {
      const fileObj = reqFiles[i];
      //TODO: update from many to one request if it posible
      const { objectId, url } = await globalThis.storageClient.getUploadUrl(
        fileObj.name
      );
      fileObj["object_id"] = objectId;

      const file = new File(fileObj);
      await file.save();

      resFiles.push({ ...file.visibleParams(), upload_url: url });
    }

    return { response: { id: requestId, files: resFiles } };
  }

  async get_download_url(ws, data) {
    const {
      id: requestId,
      get_file_urls: { file_ids: objectIds },
    } = data;

    let urls = {};
    for (const fileId of objectIds) {
      //TODO: update from many to one request if it posible
      const existUrl = (await this.fileRepository.getFileUrl(fileId))[0];
      console.log(existUrl);
      if (existUrl) {
        urls[fileId] = existUrl;
        continue;
      }

      const fileUrl = await globalThis.storageClient.getDownloadUrl(fileId);
      await this.fileRepository.storeFileUrl(fileId, fileUrl);
      urls[fileId] = fileUrl;
    }

    return { response: { id: requestId, file_urls: urls } };
  }
}

export default new FilesController();
