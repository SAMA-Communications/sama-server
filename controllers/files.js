import File from "../models/file.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { getDownloadUrl, getUploadUrl } from "../lib/minio.js";
import { slice } from "../utils/req_res_utils.js";
import validate, {
  validateFileDownloadUrl,
  validateFileId,
} from "../lib/validation.js";

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

  async getDownloadUrl(ws, data) {
    const requestId = data.request.id;
    const fileId = data.request.get_file_url.file_id;
    await validate(ws, { id: fileId }, [validateFileId]);

    const fileUrl = await getDownloadUrl(fileId);
    console.log("fileURL: ", typeof fileUrl);
    await validate(ws, { url: fileUrl }, [validateFileDownloadUrl]);

    return { response: { id: requestId, file_url: fileUrl } };
  }
}
