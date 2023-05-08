import { Client } from "minio";
import getUniqueId from "../../utils/uuid.js";
import BaseStorage from "./base.js";

export default class Minio extends BaseStorage {
  constructor(params) {
    super(params);
    this.minioClient = new Client({
      endPoint: process.env.MINIO_END_POINT,
      port: +process.env.MINIO_PORT,
      useSSL: process.env.MINIO_USE_SSL == "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }

  async getUploadUrl(fileName) {
    const objectId = getUniqueId(fileName);
    try {
      const presignedUrl = await this.minioClient.presignedPutObject(
        process.env.MINIO_BUCKET_NAME,
        objectId,
        process.env.MINIO_SESSION_TOKEN_EXPIRES_IN
      );
      return { objectId: objectId, url: presignedUrl };
    } catch (err) {
      return err;
    }
  }

  async getDownloadUrl(fileId) {
    try {
      return await this.minioClient.presignedGetObject(
        process.env.MINIO_BUCKET_NAME,
        fileId
      );
    } catch (err) {
      return err;
    }
  }
}
