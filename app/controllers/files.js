import File from "./../models/file.js";
import { storageClient } from "./../../index.js";

class FilesController {
  async createUrl(ws, data) {
    const { id: requestId, create_files: reqFiles } = data;

    const resFiles = [];
    for (let i = 0; i < reqFiles.length; i++) {
      //TODO: update from many to one request if it posible
      const { objectId, url } = await storageClient.getUploadUrl(
        reqFiles[i].name
      );
      reqFiles[i]["object_id"] = objectId;

      const file = new File(reqFiles[i]);
      await file.save();

      resFiles.push({ ...file.visibleParams(), upload_url: url });
    }

    return { response: { id: requestId, files: resFiles } };
  }

  async getDownloadUrl(ws, data) {
    const {
      id: requestId,
      get_file_urls: { file_ids: objectIds },
    } = data;

    let urls = {};
    for (let i = 0; i < objectIds.length; i++) {
      //TODO: update from many to one request if it posible
      const fileUrl = await storageClient.getDownloadUrl(objectIds[i]);
      urls[objectIds[i]] = fileUrl;
    }

    return { response: { id: requestId, file_urls: urls } };
  }
}

export default new FilesController();
