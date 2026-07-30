import { hash, verify } from '@node-rs/argon2';

/**
 * Hashes a plain-text password using Argon2.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    // Recommended defaults for Argon2id
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verifies a plain-text password against an Argon2 hash.
 */
export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  return verify(hashString, password);
}
