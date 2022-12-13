import File from "../models/file.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { getUploadUrlForFile } from "../lib/minio.js";
import { slice } from "../utils/req_res_utils.js";

export default class FileController {
  async create(ws, data) {
    const requestId = data.request.id;
    const fileParams = slice(
      data.request.create_file,
      ALLOW_FIELDS.ALLOWED_FILEDS_FILE
    );
    fileParams["upload_url"] = await getUploadUrlForFile();

    const file = new File(fileParams);
    await file.save();

    return { response: { id: requestId, file: file.visibleParams() } };
  }
}
