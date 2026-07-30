import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider } from './storage.provider.js';

export class R2StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string
  ) {
    this.bucket = bucket;
    
    // Cloudflare R2 uses the S3 API format
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(key: string, body: Buffer, mimeType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
    });

    await this.client.send(command);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async getPresignedDownloadUrl(key: string, expiresInSec: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // Generate a signed URL that allows anyone with the link to download it for `expiresInSec`
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSec });
  }
}
