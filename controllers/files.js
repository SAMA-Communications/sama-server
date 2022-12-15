import File from "../models/file.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { slice } from "../utils/req_res_utils.js";
import { storageClient } from "../index.js";
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

    const { objectId, url } = await storageClient.getUploadUrl(
      fileParams.name || "file"
    );
    fileParams["object_id"] = objectId;

    const file = new File(fileParams);
    await file.save();

    return {
      response: {
        id: requestId,
        file: { ...file.visibleParams(), upload_url: url },
      },
    };
  }

  async getDownloadUrl(ws, data) {
    const requestId = data.request.id;
    const objectId = data.request.get_file_url.file_id;
    await validate(ws, { id: objectId }, [validateFileId]);

    const fileUrl = await storageClient.getDownloadUrl(objectId);
    await validate(ws, { url: fileUrl }, [validateFileDownloadUrl]);

    return { response: { id: requestId, file_url: fileUrl } };
  }
}
