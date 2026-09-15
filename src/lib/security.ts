import crypto from 'crypto';

/**
 * Validates that a customer password / PIN consists of exactly 4 numeric digits.
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'Password must contain exactly 4 digits.' };
  }
  const clean = pin.trim();
  if (!/^\d{4}$/.test(clean)) {
    return { valid: false, error: 'Password must contain exactly 4 digits.' };
  }
  return { valid: true };
}

/**
 * Validates that a Customer mobile number consists of exactly 10 numeric digits.
 * Normalizes input by stripping formatting, spaces, and leading +91 / 91 country code.
 */
export function validateCustomerMobileNumber(mobile: string): { valid: boolean; normalized?: string; error?: string } {
  if (!mobile || typeof mobile !== 'string') {
    return { valid: false, error: 'Enter a valid 10-digit mobile number.' };
  }
  const digits = mobile.trim().replace(/\D/g, '');
  const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;

  if (!/^\d{10}$/.test(normalized)) {
    return { valid: false, error: 'Enter a valid 10-digit mobile number.' };
  }
  return { valid: true, normalized };
}

/**
 * Validates that a Customer Login ID consists of numeric digits only (standard: 10-digit mobile).
 */
export function validateCustomerLoginId(id: string): { valid: boolean; normalized?: string; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Enter a valid 10-digit mobile number.' };
  }
  const raw = id.trim();
  if (!/^\d+$/.test(raw)) {
    return { valid: false, error: 'Enter a valid 10-digit mobile number.' };
  }
  const normalized = raw.length === 12 && raw.startsWith('91') ? raw.slice(2) : raw;
  if (!/^\d{10}$/.test(normalized)) {
    // If not exactly 10 digits, allow 3-15 for backward compatibility with legacy custom numeric IDs
    if (raw.length < 3 || raw.length > 15) {
      return { valid: false, error: 'Enter a valid 10-digit mobile number.' };
    }
  }
  return { valid: true, normalized };
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
