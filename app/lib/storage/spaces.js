import BaseStorage from "./base.js";
import { PutObjectCommand, S3, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default class Spaces extends BaseStorage {
  constructor(params) {
    super(params);
    this.spacesClient = new S3({
      endpoint: process.env.SPACES_ENPOINT,
      region: process.env.SPACES_REGION,
      credentials: {
        accessKeyId: process.env.SPACES_KEY,
        secretAccessKey: process.env.SPACES_SECRET,
      },
    });
  }

  async getUploadUrl(key, contentType) {
    try {
      const objectId = getUniqueId(key);
      const bucketParams = {
        Bucket: process.env.SPACES_BUCKET_NAME,
        Key: objectId,
        ContentType: contentType || "image/png",
      };

      const presignedUrl = await getSignedUrl(
        this.spacesClient,
        new PutObjectCommand(bucketParams),
        { expiresIn: process.env.FILE_UPLOAD_URL_EXPIRES_IN }
      );
      console.log("getUploadUrl response: ", { objectId, url: presignedUrl });
      return { objectId, url: presignedUrl };
    } catch (e) {
      console.log(e);
    }
  }

  async getDownloadUrl(key) {
    try {
      const bucketParams = {
        Bucket: process.env.SPACES_BUCKET_NAME,
        Key: key,
      };

      return await getSignedUrl(
        this.spacesClient,
        new GetObjectCommand(bucketParams),
        { expiresIn: process.env.FILE_UPLOAD_URL_EXPIRES_IN }
      );
    } catch (e) {
      console.log(e);
    }
  }
}
