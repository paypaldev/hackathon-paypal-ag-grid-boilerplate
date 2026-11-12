import crypto from 'crypto';
import type { CurrencyCode } from './types';

/**
 * Deterministic JSON stringification for stable SHA-256 fingerprinting.
 * Sorts object keys recursively.
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalJsonStringify((obj as Record<string, unknown>)[k])}`
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes standard FIPS 180-4 SHA-256 hex digest of canonical JSON.
 */
export function computeSha256(data: string | Buffer | unknown): string {
  const hash = crypto.createHash('sha256');
  if (typeof data === 'string') {
    hash.update(data, 'utf8');
  } else if (Buffer.isBuffer(data)) {
    hash.update(data);
  } else {
    hash.update(canonicalJsonStringify(data), 'utf8');
  }
  return hash.digest('hex');
}

/**
 * Computes an audit chain digest:
 * H_n = SHA-256(H_{n-1} + ":" + timestamp + ":" + actor + ":" + action + ":" + payloadDigest)
 */
export function computeAuditChainDigest(
  previousDigest: string,
  timestamp: string,
  actor: string,
  action: string,
  payloadDigest: string
): string {
  const raw = `${previousDigest}:${timestamp}:${actor}:${action}:${payloadDigest}`;
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

/**
 * Converts integer minor units to human-readable currency string.
 * Example: 250000 minor units USD -> "$2,500.00"
 */
export function formatMinorUnits(minor: number | null | undefined, currency: CurrencyCode = 'USD'): string {
  if (minor === null || minor === undefined) {
    return 'Pending Confirmation';
  }
  const major = minor / 100;
  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
  };
  const symbol = symbolMap[currency] || `${currency} `;
  return `${symbol}${major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Parses major units (dollars) into integer minor units safely.
 * Example: "2500.50" -> 250050
 */
export function parseToMinorUnits(amount: number | string): number {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

