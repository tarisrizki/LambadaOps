import { setCookie, getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { RefreshTokenClaims, CsrfTokenPayload } from './jwt.js';

/**
 * Names of the cookies used by the auth layer.
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token',
} as const;

/** Options for the access token cookie (httpOnly, short-lived). */
const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 15 * 60, // 15 minutes in seconds
  path: '/',
};

/** Options for the refresh token cookie (httpOnly, 7-day lifetime). */
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: '/api/auth/refresh',
};

/** Options for the CSRF token cookie (httpOnly — not readable by JS). */
const CSRF_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
};

/**
 * Sets the access token as an httpOnly, Secure, SameSite=Strict cookie.
 */
export function setAccessTokenCookie(c: Context, token: string): void {
  setCookie(c, COOKIE_NAMES.ACCESS_TOKEN, token, ACCESS_TOKEN_COOKIE_OPTIONS);
}

/**
 * Sets the refresh token as an httpOnly, Secure, SameSite=Strict cookie.
 * The cookie is scoped to the /api/auth/refresh path so it is only sent
 * to the refresh endpoint.
 */
export function setRefreshTokenCookie(c: Context, token: string): void {
  setCookie(c, COOKIE_NAMES.REFRESH_TOKEN, token, REFRESH_TOKEN_COOKIE_OPTIONS);
}

/**
 * Clears the access token cookie (used on logout).
 */
export function clearAccessTokenCookie(c: Context): void {
  setCookie(c, COOKIE_NAMES.ACCESS_TOKEN, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  });
}

/**
 * Clears the refresh token cookie (used on logout).
 */
export function clearRefreshTokenCookie(c: Context): void {
  setCookie(c, COOKIE_NAMES.REFRESH_TOKEN, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/api/auth/refresh',
  });
}

/**
 * Sets the CSRF token cookie (httpOnly, not readable by client JS).
 * The token *value* to echo back in the X-CSRF-Token header is returned
 * alongside so the caller can put it in the response body.
 */
export function setCsrfCookie(c: Context, csrf: CsrfTokenPayload): string {
  setCookie(c, COOKIE_NAMES.CSRF_TOKEN, csrf.token, CSRF_TOKEN_COOKIE_OPTIONS);
  return csrf.value;
}

/**
 * Retrieves the refresh token from the httpOnly cookie.
 */
export function getRefreshTokenFromCookie(c: Context): string | undefined {
  return getCookie(c, COOKIE_NAMES.REFRESH_TOKEN);
}

/**
 * Retrieves the access token from the httpOnly cookie.
 */
export function getAccessTokenFromCookie(c: Context): string | undefined {
  return getCookie(c, COOKIE_NAMES.ACCESS_TOKEN);
}

/**
 * Retrieves the CSRF token from its httpOnly cookie.
 */
export function getCsrfCookie(c: Context): string | undefined {
  return getCookie(c, COOKIE_NAMES.CSRF_TOKEN);
}

/**
 * Convenience: extract the raw claims from a refresh token cookie value.
 * Returns null if the cookie is missing or the token is malformed/expired.
 */
export async function claimsFromRefreshTokenCookie(
  c: Context
): Promise<RefreshTokenClaims | null> {
  const token = getRefreshTokenFromCookie(c);
  if (!token) return null;

  try {
    const { verifyRefreshToken } = await import('./jwt.js');
    return await verifyRefreshToken(token);
  } catch {
    return null;
  }
}
