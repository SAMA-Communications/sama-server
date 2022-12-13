import File from "../models/file.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { getDownloadUrl, getUploadUrl } from "../lib/minio.js";
import { slice } from "../utils/req_res_utils.js";

export default class FileController {
  async createUrl(ws, data) {
    const requestId = data.request.id;
    const fileParams = slice(
      data.request.create_file,
      ALLOW_FIELDS.ALLOWED_FILEDS_FILE
    );
    const { fileId, url } = await getUploadUrl(fileParams.name || "file");
    fileParams["upload_url"] = url;
    fileParams["file_id"] = fileId;

    const file = new File(fileParams);
    await file.save();
    return { response: { id: requestId, file: file.visibleParams() } };
  }

  async storeFile(ws, data) {
    const requestId = data.request.id;

    return { response: { id: requestId, success: true } };
  }

  async getFileUrl(ws, data) {
    const requestId = data.request.id;
    const fileId = data.request.get_file_url.file_id;
    //TODO validate isFileId

    const fileUrl = await getDownloadUrl(fileId);
    //TODO validate isFileUrl find

    return { response: { id: requestId, file_url: fileUrl } };
  }
}
