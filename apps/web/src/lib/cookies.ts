/**
 * Cookie helpers used by the auth layer.
 *
 * The API token is stored in a cookie (not localStorage) so that it can be
 * read by the Hono client headers callback while being scoped to the
 * application origin.  A companion CSRF token is also stored in a cookie
 * and sent back via the `X-CSRF-Token` header on state-changing requests.
 *
 * NOTE: This is a progressive step toward true httpOnly cookies.  The token
 * cookie is NOT yet httpOnly because the Hono RPC client currently reads it
 * to build the `Authorization` header.  When the backend begins setting
 * httpOnly cookies directly (see ENG-004), `getAuthToken` will delegate to the
 * cookie and the Authorization header can be dropped entirely.
 */

const TOKEN_COOKIE = 'lambadaops_token';
const CSRF_COOKIE = 'lambadaops_csrf';

/** Parse `document.cookie` into a plain object. */
function parseCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const cookies: Record<string, string> = {};
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (!name) continue;
    cookies[decodeURIComponent(name)] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  const expires = `Max-Age=${maxAgeSeconds}`;
  const sameSite = 'SameSite=Lax';
  const secure = 'Secure';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; ${expires}; ${sameSite}; ${secure}`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

/* ── Auth token cookie ────────────────────────────────────────────────── */

export function getTokenCookie(): string | null {
  return parseCookies()[TOKEN_COOKIE] || null;
}

export function setTokenCookie(token: string, maxAgeSeconds = 7 * 24 * 60 * 60) {
  setCookie(TOKEN_COOKIE, token, maxAgeSeconds);
}

export function removeTokenCookie() {
  removeCookie(TOKEN_COOKIE);
}

/* ── CSRF token cookie ────────────────────────────────────────────────── */

export function getCsrfToken(): string | null {
  return parseCookies()[CSRF_COOKIE] || null;
}

export function setCsrfToken(token: string, maxAgeSeconds = 7 * 24 * 60 * 60) {
  setCookie(CSRF_COOKIE, token, maxAgeSeconds);
}

export function removeCsrfToken() {
  removeCookie(CSRF_COOKIE);
}
