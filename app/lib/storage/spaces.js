import BaseStorage from "./base.js";
import {
  ListBucketsCommand,
  PutObjectCommand,
  S3,
  CreateBucketCommand,
  DeleteBucketCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
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

  async createBucket() {
    try {
      const bucketParams = { Bucket: process.env.SPACES_BUCKET_NAME };
      const data = await this.spacesClient.send(
        new CreateBucketCommand(bucketParams)
      );
      console.log("[SPACES] Bucket create success", data.Location);
      return data;
    } catch (e) {
      console.log(e);
    }
  }

  async deleteBucket() {
    try {
      const bucketParams = { Bucket: process.env.SPACES_BUCKET_NAME };
      const data = await this.spacesClient.send(
        new DeleteBucketCommand(bucketParams)
      );
      console.log("[SPACES] Bucket deleted");
      return data;
    } catch (err) {
      console.log("Error", err);
    }
  }

  async getAllBuckets() {
    try {
      const data = await this.spacesClient.send(new ListBucketsCommand({}));
      return data.Buckets;
    } catch (e) {
      console.log(e);
    }
  }

  async getUploadUrl(key, contentType) {
    try {
      const bucketParams = {
        Bucket: process.env.SPACES_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      };

      //CreatePresignedPost
      return await getSignedUrl(
        this.spacesClient,
        new PutObjectCommand(bucketParams),
        { expiresIn: 15 * 60 } //to .env??
      );
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
        { expiresIn: 15 * 60 } //to .env??
      );
    } catch (e) {
      console.log(e);
    }
  }

  async downloadFile() {}
  async uploadFile() {}
  async delteFile() {}
  //   async listAllFiles() {
  //     try {
  //       const bucketParams = { Bucket: process.env.SPACES_BUCKET_NAME };
  //       return await this.spacesClient.send(new ListObjectsCommand(bucketParams));
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   }
}
