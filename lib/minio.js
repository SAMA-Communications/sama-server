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

async function getUploadUrlForFile(fileName) {
  const objectId = getUniqueId(fileName);
  return minioClient.presignedPutObject(bucketName, objectId, 3600);
}

export { getUploadUrlForFile };
