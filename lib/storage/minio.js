import { Client } from "minio";
import getUniqueId from "../../utils/uuid.js";

export const minioClient = new Client({
  endPoint: process.env.MINIO_END_POINT,
  port: 9000,
  useSSL: false,
  accessKey: "TKJf6ugHm2704GKc",
  secretKey: "n87C6Yiy9YseXVz4fZs66rR8ZPfoPGhK",
});

async function getUploadUrl(fileName) {
  const fileId = getUniqueId(fileName);
  try {
    const presignedUrl = await minioClient.presignedPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileId,
      3600
    );
    return { fileId: fileId, url: presignedUrl };
  } catch (err) {
    return err;
  }
}

async function getDownloadUrl(fileId) {
  try {
    return await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET_NAME,
      fileId
    );
  } catch (err) {
    return err;
  }
}

export { getUploadUrl, getDownloadUrl };
