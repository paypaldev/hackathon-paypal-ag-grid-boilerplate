import crypto from 'node:crypto';

// In-memory certificate cache: certUrl -> pemString
const certCache = new Map<string, { pem: string; fetchedAt: number }>();
const CERT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Standard IEEE 802.3 32-bit CRC implementation (unsigned decimal output for PayPal).
 */
export function computeCrc32Unsigned(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Validates that the certificate URL is a trusted PayPal domain.
 */
export function isTrustedPayPalCertUrl(certUrl: string): boolean {
  try {
    const parsed = new URL(certUrl);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'api-m.sandbox.paypal.com' ||
        parsed.hostname === 'api-m.paypal.com' ||
        parsed.hostname.endsWith('.paypal.com'))
    );
  } catch {
    return false;
  }
}

/**
 * Fetches and caches the X.509 public key certificate from PayPal.
 */
export async function getPayPalCertificate(certUrl: string): Promise<string> {
  if (!isTrustedPayPalCertUrl(certUrl)) {
    throw new Error(`Untrusted certificate URL: ${certUrl}`);
  }

  const cached = certCache.get(certUrl);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CERT_CACHE_TTL_MS) {
    return cached.pem;
  }

  const res = await fetch(certUrl, { cache: 'force-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch certificate from ${certUrl}: HTTP ${res.status}`);
  }
  const pem = await res.text();
  certCache.set(certUrl, { pem, fetchedAt: now });
  return pem;
}

/**
 * Local Cryptographic Verification:
 * Validates transmissionId|transmissionTime|webhookId|crc32 against RSA-SHA256 signature.
 * Essential for Webhook Simulator compatibility (which PayPal's verify-webhook-signature API rejects).
 */
export async function verifyWebhookLocalCrypto(
  rawBody: string,
  headers: {
    authAlgo: string;
    certUrl: string;
    transmissionId: string;
    transmissionSig: string;
    transmissionTime: string;
    webhookId: string;
  }
): Promise<{ verified: boolean; error?: string }> {
  try {
    if (!isTrustedPayPalCertUrl(headers.certUrl)) {
      return { verified: false, error: 'Cert URL is not a trusted PayPal host' };
    }

    const pem = await getPayPalCertificate(headers.certUrl);
    const crc = computeCrc32Unsigned(Buffer.from(rawBody, 'utf-8'));
    const messageToVerify = `${headers.transmissionId}|${headers.transmissionTime}|${headers.webhookId}|${crc}`;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(messageToVerify);
    const isValid = verifier.verify(pem, Buffer.from(headers.transmissionSig, 'base64'));

    return { verified: isValid };
  } catch (err: unknown) {
    return {
      verified: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

