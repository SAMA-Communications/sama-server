import BaseStorage from "./base.js";
import getUniqueId from "../../utils/uuid.js";
import { Client } from "minio";

export default class Minio extends BaseStorage {
  constructor(params) {
    super(params);
    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: +process.env.MINIO_PORT,
      useSSL: process.env.MINIO_USE_SSL == "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }

  async getUploadUrl(fileName) {
    const objectId = getUniqueId(fileName);
    console.log("Minio getUploadUrl in");
    try {
      const presignedUrl = await this.minioClient.presignedPutObject(
        process.env.MINIO_BUCKET_NAME,
        objectId,
        +process.env.FILE_UPLOAD_URL_EXPIRES_IN
      );
      console.log("getUploadUrl response: ", { objectId, url: presignedUrl });
      return { objectId, url: presignedUrl };
    } catch (err) {
      console.log("Error: ", err);
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
