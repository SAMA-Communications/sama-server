import { Client } from "minio";
import getUniqueId from "../utils/uuid.js";

export const minioClient = new Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "TKJf6ugHm2704GKc",
  secretKey: "n87C6Yiy9YseXVz4fZs66rR8ZPfoPGhK",
});

const bucketName = "sama-server";

async function getUploadUrl(fileName) {
  const fileId = getUniqueId(fileName);
  try {
    const presignedUrl = await minioClient.presignedPutObject(
      bucketName,
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
    return await minioClient.presignedGetObject(bucketName, fileId);
  } catch (err) {
    return err;
  }
}

export { getUploadUrl, getDownloadUrl };
