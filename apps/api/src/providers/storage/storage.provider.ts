/**
 * Abstract interface for interacting with object storage.
 * This completely isolates the application from vendor-specific SDKs (like AWS S3).
 */
export interface StorageProvider {
  /**
   * Uploads a file to the storage provider.
   * @param key The unique storage key (e.g., tenants/1/assets/2/uuid.png)
   * @param body The file buffer
   * @param mimeType The file mime type
   */
  upload(key: string, body: Buffer, mimeType: string): Promise<void>;

  /**
   * Deletes a file from the storage provider.
   * Should not throw if the file doesn't exist.
   * @param key The unique storage key
   */
  delete(key: string): Promise<void>;

  /**
   * Generates a temporary, presigned URL for downloading the file securely.
   * @param key The unique storage key
   * @param expiresInSec How long the URL should be valid (in seconds)
   */
  getPresignedDownloadUrl(key: string, expiresInSec: number): Promise<string>;
}
