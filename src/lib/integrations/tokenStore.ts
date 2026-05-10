/**
 * Cookie-based encrypted token store.
 *
 * Stores OAuth access/refresh tokens in AES-256-GCM encrypted HTTP-only
 * cookies so the standalone calendar needs no database. Each provider
 * gets its own cookie (`int_google`, `int_microsoft`).
 */
import { cookies } from 'next/headers';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // unix ms
  scope?: string;
}

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const COOKIE_PREFIX = 'int_';

function getSecret(): Buffer {
  const hex = process.env.INTEGRATION_SECRET;
  if (!hex || hex === 'change-me-to-a-random-64-hex-string') {
    throw new Error(
      'INTEGRATION_SECRET is not set. Generate one with:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  // Accept either 32-byte hex (64 chars) or raw 32-char string
  if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) {
    return Buffer.from(hex, 'hex');
  }
  // Fallback: hash the string to get exactly 32 bytes
  const { createHash } = require('crypto');
  return createHash('sha256').update(hex).digest();
}

function encrypt(plaintext: string): string {
  const key = getSecret();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv + tag + ciphertext, base64-encoded
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(encoded: string): string {
  const key = getSecret();
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final('utf8');
}

function cookieName(provider: string): string {
  return `${COOKIE_PREFIX}${provider}`;
}

/** Store tokens for a provider in an encrypted HTTP-only cookie. */
export async function setTokens(provider: string, tokens: StoredTokens): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(provider), encrypt(JSON.stringify(tokens)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

/** Retrieve stored tokens for a provider (null if not found or invalid). */
export async function getTokens(provider: string): Promise<StoredTokens | null> {
  const jar = await cookies();
  const raw = jar.get(cookieName(provider))?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decrypt(raw)) as StoredTokens;
  } catch {
    return null;
  }
}

/** Delete stored tokens for a provider. */
export async function clearTokens(provider: string): Promise<void> {
  const jar = await cookies();
  jar.delete(cookieName(provider));
}

/** Check whether a provider has valid (non-expired) tokens. */
export async function isConnected(provider: string): Promise<boolean> {
  const tokens = await getTokens(provider);
  if (!tokens) return false;
  // Consider connected if we have a refresh token (can renew) or access token isn't expired
  if (tokens.refreshToken) return true;
  return tokens.expiresAt > Date.now();
}
