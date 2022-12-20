import File from "../models/file.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { slice } from "../utils/req_res_utils.js";
import { storageClient } from "../index.js";
import validate, {
  validateFileDownloadUrl,
  validateFileIds,
} from "../lib/validation.js";

export default class FileController {
  async createUrl(ws, data) {
    const requestId = data.request.id;
    const reqFiles = data.request.create_files.map((file) =>
      slice(file, ALLOW_FIELDS.ALLOWED_FILEDS_FILE)
    );

    const resFiles = [];
    for (let i = 0; i < reqFiles.length; i++) {
      //TODO: update from many to one request if it posible
      const { objectId, url } = await storageClient.getUploadUrl(
        reqFiles[i].name || "file"
      );
      reqFiles[i]["object_id"] = objectId;

      const file = new File(reqFiles[i]);
      await file.save();

      resFiles.push({ ...file.visibleParams(), upload_url: url });
    }

    return { response: { id: requestId, files: resFiles } };
  }

  async getDownloadUrl(ws, data) {
    const requestId = data.request.id;
    const objectIds = data.request.get_file_urls.file_ids;
    await validate(ws, { ids: objectIds }, [validateFileIds]);

    let urls = {};
    for (let i = 0; i < objectIds.length; i++) {
      //TODO: update from many to one request if it posible
      const fileUrl = await storageClient.getDownloadUrl(objectIds[i]);
      // await validate(ws, { url: fileUrl }, [validateFileDownloadUrl]);
      urls[objectIds[i]] = fileUrl;
    }

    return { response: { id: requestId, file_urls: urls } };
  }
}
