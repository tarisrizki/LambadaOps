import type { StorageProvider } from './storage.provider.js';

/**
 * Mock implementation of StorageProvider for local development and testing.
 * Instead of uploading to a real cloud provider, it stores files in memory (or logs them).
 */
export class MockStorageProvider implements StorageProvider {
  private storage = new Map<string, Buffer>();

  async upload(key: string, body: Buffer, mimeType: string): Promise<void> {
    console.log(`[MockStorage] Uploaded ${key} (${mimeType}) - ${body.length} bytes`);
    this.storage.set(key, body);
  }

  async delete(key: string): Promise<void> {
    console.log(`[MockStorage] Deleted ${key}`);
    this.storage.delete(key);
  }

  async getPresignedDownloadUrl(key: string, expiresInSec: number): Promise<string> {
    if (!this.storage.has(key)) {
      throw new Error(`[MockStorage] Key not found: ${key}`);
    }
    console.log(`[MockStorage] Generated presigned URL for ${key} (expires in ${expiresInSec}s)`);
    // Return a dummy URL that points to localhost (if you want to serve it locally for dev, you'd need a mock endpoint)
    // For now, returning a mock data URL or a mock endpoint
    return `http://localhost:3000/mock-storage/${encodeURIComponent(key)}?expiresIn=${expiresInSec}`;
  }
}
