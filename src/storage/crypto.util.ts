import { getLibConfig } from "../config/lib-config";

/**
 * Encrypted storage utilities using the Web Crypto API (AES-GCM 256-bit).
 *
 * Important: this runs client-side, so the secret is also client-visible.
 * This protects against accidental storage disclosure, not against XSS.
 */

const DEFAULT_STORAGE_SECRET = "default-storage-secret-change-me";
const LEGACY_SALT = "hexagonal-storage-salt";
let warnedWeakSecret = false;

function getCryptoConfig(): { nodeEnv: string; storageSecret: string } {
  const { nodeEnv, storageSecret } = getLibConfig();
  return { nodeEnv, storageSecret };
}

function assertSecret(): void {
  const { nodeEnv, storageSecret } = getCryptoConfig();
  const isDefaultSecret =
    !storageSecret || storageSecret === DEFAULT_STORAGE_SECRET;

  if (nodeEnv !== "production" && isDefaultSecret && !warnedWeakSecret) {
    warnedWeakSecret = true;
    console.warn(
      "[storage.crypto] Using the default storage secret. Configure ESTEDIO_STORAGE_SECRET (or NEXT_PUBLIC_STORAGE_SECRET) for non-demo environments.",
    );
  }

  if (nodeEnv === "production" && isDefaultSecret) {
    throw new Error(
      "A strong storage secret must be configured in production.",
    );
  }
}

const SALT_LENGTH = 16;
const IV_LENGTH = 12; // bytes — standard for AES-GCM
const PBKDF2_ITERATIONS = 600_000;
const LEGACY_PBKDF2_ITERATIONS = 100_000;

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(
    view.byteOffset,
    view.byteOffset + view.byteLength,
  ) as ArrayBuffer;
}

async function deriveKey(
  secret: string,
  salt: ArrayBuffer,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encrypt(plaintext: string): Promise<string> {
  assertSecret();
  const { storageSecret } = getCryptoConfig();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(storageSecret, toArrayBuffer(salt));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  const combined = new Uint8Array(
    SALT_LENGTH + IV_LENGTH + cipherBuffer.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(cipherBuffer), SALT_LENGTH + IV_LENGTH);

  return bufferToBase64(combined.buffer);
}

export async function decrypt(ciphertext: string): Promise<string> {
  assertSecret();
  const { storageSecret } = getCryptoConfig();
  const combined = base64ToBuffer(ciphertext);

  if (combined.length <= IV_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }

  if (combined.length > SALT_LENGTH + IV_LENGTH) {
    try {
      const salt = combined.slice(0, SALT_LENGTH);
      const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const cipherBuffer = combined.slice(SALT_LENGTH + IV_LENGTH);
      const key = await deriveKey(storageSecret, toArrayBuffer(salt));
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        cipherBuffer,
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch {
      // Retry with legacy PBKDF2 iterations for backward compatibility.
      try {
        const salt = combined.slice(0, SALT_LENGTH);
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const cipherBuffer = combined.slice(SALT_LENGTH + IV_LENGTH);
        const key = await deriveKey(
          storageSecret,
          toArrayBuffer(salt),
          LEGACY_PBKDF2_ITERATIONS,
        );
        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          cipherBuffer,
        );
        return new TextDecoder().decode(decryptedBuffer);
      } catch {
        // Fall through to legacy payload format for backward compatibility.
      }
    }
  }

  const key = await deriveKey(
    storageSecret,
    new TextEncoder().encode(LEGACY_SALT).buffer,
    LEGACY_PBKDF2_ITERATIONS,
  );
  const iv = combined.slice(0, IV_LENGTH);
  const cipherBuffer = combined.slice(IV_LENGTH);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBuffer,
  );

  return new TextDecoder().decode(decryptedBuffer);
}
