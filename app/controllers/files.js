import BaseController from "./base/base.js";
import File from "./../models/file.js";

class FilesController extends BaseController {
  constructor() {
    super();
  }

  async createUrl(ws, data) {
    const { id: requestId, create_files: reqFiles } = data;

    const resFiles = [];
    for (let i = 0; i < reqFiles.length; i++) {
      //TODO: update from many to one request if it posible
      const { objectId, url } = await global.storageClient.getUploadUrl(
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
      const fileUrl = await global.storageClient.getDownloadUrl(objectIds[i]);
      urls[objectIds[i]] = fileUrl;
    }
    console.log("urls: ", urls);
    return { response: { id: requestId, file_urls: urls } };
  }
}

export default new FilesController();
