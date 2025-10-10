import crypto from 'crypto';

// AES-256-GCM helpers
// ENCRYPTION_KEY should be 32-byte base64 string
const keyB64 = process.env.ENCRYPTION_KEY || '';
if (!keyB64) {
  // Do not throw at import time to avoid breaking tools; runtime calls will throw with clearer message
}

function getKey(): Buffer {
  if (!keyB64) throw new Error('ENCRYPTION_KEY is not set');
  const raw = Buffer.from(keyB64, 'base64');
  if (raw.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes base64');
  return raw;
}

export function encryptAesGcm(plaintext: Buffer | string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ptBuf = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext);
  const ct = Buffer.concat([cipher.update(ptBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ct, iv, tag, algo: 'aes-256-gcm' as const };
}

export function decryptAesGcm(params: { ct: Buffer; iv: Buffer; tag: Buffer }) {
  const { ct, iv, tag } = params;
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt;
}

// File helpers: we store a single binary blob: [IV(12) | CT | TAG(16)]
export function packEncrypted(iv: Buffer, ct: Buffer, tag: Buffer) {
  return Buffer.concat([iv, ct, tag]);
}

export function unpackEncrypted(blob: Buffer) {
  if (blob.length < 12 + 16) throw new Error('Invalid encrypted blob');
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(blob.length - 16);
  const ct = blob.subarray(12, blob.length - 16);
  return { iv, ct, tag };
}
