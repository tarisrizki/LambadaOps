import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from '../env.js';

export interface AccessTokenClaims {
  userId: number;
  tenantId: number;
  roleId: number;
}

/**
 * Generates a signed Access Token (JWT) using HMAC-SHA256.
 */
export async function generateAccessToken(claims: AccessTokenClaims): Promise<string> {
  const env = getEnv();
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

/**
 * Verifies a JWT and extracts the strongly-typed AccessTokenClaims.
 * Throws if the token is invalid or expired.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const env = getEnv();
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  const { payload } = await jwtVerify(token, secret);
  
  // Cast payload to AccessTokenClaims.
  // In a stricter setup, we could parse this with Zod, but since we sign it
  // internally, casting is acceptable.
  return {
    userId: payload.userId as number,
    tenantId: payload.tenantId as number,
    roleId: payload.roleId as number,
  };
}
