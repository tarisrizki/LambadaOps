import { S3Client } from '@aws-sdk/client-s3';
import { getEnv } from './env.js';

let s3Client: S3Client | null = null;

/**
 * Initializes and returns the S3 client configured for Cloudflare R2.
 * If credentials are not provided (e.g., local development), it returns null.
 */
export function getS3Client(): S3Client | null {
  if (s3Client !== undefined && s3Client !== null) {
    return s3Client;
  }

  const env = getEnv();
  
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    // Return null to signify mock mode
    return null;
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}
