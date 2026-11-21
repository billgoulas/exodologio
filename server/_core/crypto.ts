import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ENV } from "./env";

/**
 * Symmetric encryption for secrets we must store at rest (e.g. bank OAuth tokens).
 * The key is derived from the server's existing JWT secret so no extra deployment
 * configuration is required, while still being unique to this server's config.
 *
 * If JWT_SECRET is ever missing, deriving from an empty string would produce a
 * fixed key computable from this source file, silently defeating the whole
 * point of encrypting tokens at rest — fail loudly at startup instead.
 */
if (!ENV.cookieSecret) {
  throw new Error(
    "JWT_SECRET is not set — refusing to derive a predictable bank-token encryption key. Set JWT_SECRET before starting the server.",
  );
}

const ENCRYPTION_KEY = createHash("sha256")
  .update(`${ENV.cookieSecret}:bank-token-encryption`)
  .digest();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptSecret(encrypted: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted value");
  }
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
