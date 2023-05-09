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
      const { objectId, url } = await globalThis.storageClient.getUploadUrl(
        reqFiles[i].name
      );
      console.log("Response of create url: ", { objectId, url });
      reqFiles[i]["object_id"] = objectId;

      const file = new File(reqFiles[i]);
      await file.save();

      resFiles.push({ ...file.visibleParams(), upload_url: url });
    }
    console.log("Files response: ", resFiles);

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
      const fileUrl = await globalThis.storageClient.getDownloadUrl(
        objectIds[i]
      );
      urls[objectIds[i]] = fileUrl;
    }

    return { response: { id: requestId, file_urls: urls } };
  }
}

export default new FilesController();
