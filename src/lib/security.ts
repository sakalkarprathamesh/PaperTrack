import crypto from 'crypto';

/**
 * Validates that a PIN consists of exactly 4 numeric digits.
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'PIN is required' };
  }
  const clean = pin.trim();
  if (!/^\d{4}$/.test(clean)) {
    return { valid: false, error: 'PIN must be exactly 4 numeric digits' };
  }
  return { valid: true };
}

/**
 * Validates that a Customer Login ID consists of numeric digits only.
 */
export function validateCustomerLoginId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Customer Login ID is required' };
  }
  const clean = id.trim();
  if (!/^\d+$/.test(clean)) {
    return { valid: false, error: 'Customer Login ID must contain digits only' };
  }
  if (clean.length < 3 || clean.length > 15) {
    return { valid: false, error: 'Customer Login ID must be between 3 and 15 digits' };
  }
  return { valid: true };
}

/**
 * Normalizes and validates a Delivery Boy ID.
 * Expected format: 'D' followed by exactly 3 digits (e.g. 'D001', 'D125').
 * Normalizes lowercase 'd' to 'D' and trims whitespace.
 */
export function validateDeliveryBoyId(id: string): { valid: boolean; normalized?: string; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Delivery Staff ID is required' };
  }
  const normalized = id.trim().toUpperCase();
  if (!/^D\d{3}$/.test(normalized)) {
    return {
      valid: false,
      error: 'Delivery Staff ID must be "D" followed by exactly 3 digits (e.g. D001, D002)',
    };
  }
  return { valid: true, normalized };
}

/**
 * Hashes a 4-digit PIN using Node.js scrypt KDF with a cryptographically secure random salt.
 * Produces format: `<salt_hex>:<hash_hex>`
 */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin.trim(), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a PIN against a stored scrypt hash using timing-safe comparison.
 * Always executes scrypt computation even if storedHash is missing or invalid
 * to protect against timing side-channel attacks.
 */
export function verifyPin(pin: string, storedHash?: string | null): boolean {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    // Dummy computation to equalize timing
    const dummySalt = '00000000000000000000000000000000';
    crypto.scryptSync(pin || '0000', dummySalt, 64);
    return false;
  }

  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) {
      return false;
    }
    const keyBuffer = Buffer.from(originalHash, 'hex');
    const derivedKey = crypto.scryptSync(pin.trim(), salt, 64);

    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
