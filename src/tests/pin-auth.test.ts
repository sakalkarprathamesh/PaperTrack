import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePin,
  validateCustomerLoginId,
  validateDeliveryBoyId,
  hashPin,
  verifyPin,
} from '../lib/security';
import { dataService } from '../lib/data-service';
import { en } from '../lib/i18n/translations/en';
import { mr } from '../lib/i18n/translations/mr';
import { hi } from '../lib/i18n/translations/hi';

describe('PaperTrack — Customer & Delivery Boy PIN Authentication Suite', () => {
  // --------------------------------------------------------------------------
  // 1. PIN & ID FORMAT VALIDATIONS
  // --------------------------------------------------------------------------
  describe('Input Validation & Format Checks', () => {
    it('accepts exactly 4-digit numeric PINs', () => {
      expect(validatePin('1234').valid).toBe(true);
      expect(validatePin('0000').valid).toBe(true);
      expect(validatePin('9999').valid).toBe(true);
      expect(validatePin(' 7941 ').valid).toBe(true);
    });

    it('rejects PINs that are not exactly 4 digits or contain letters/symbols', () => {
      expect(validatePin('123').valid).toBe(false);
      expect(validatePin('12345').valid).toBe(false);
      expect(validatePin('abcd').valid).toBe(false);
      expect(validatePin('12a4').valid).toBe(false);
      expect(validatePin('12-4').valid).toBe(false);
      expect(validatePin('').valid).toBe(false);
    });

    it('accepts valid Customer Login IDs with digits only', () => {
      expect(validateCustomerLoginId('12345').valid).toBe(true);
      expect(validateCustomerLoginId('919822111001').valid).toBe(true);
      expect(validateCustomerLoginId('1001').valid).toBe(true);
    });

    it('rejects Customer Login IDs containing letters, spaces, or symbols', () => {
      expect(validateCustomerLoginId('cust123').valid).toBe(false);
      expect(validateCustomerLoginId('user@papertrack.com').valid).toBe(false);
      expect(validateCustomerLoginId('12 34').valid).toBe(false);
      expect(validateCustomerLoginId('12').valid).toBe(false); // Too short (< 3 digits)
      expect(validateCustomerLoginId('').valid).toBe(false);
    });

    it('accepts and normalizes Delivery Boy IDs matching ^D\\d{3}$', () => {
      const res1 = validateDeliveryBoyId('D001');
      expect(res1.valid).toBe(true);
      expect(res1.normalized).toBe('D001');

      const res2 = validateDeliveryBoyId('d002');
      expect(res2.valid).toBe(true);
      expect(res2.normalized).toBe('D002');

      const res3 = validateDeliveryBoyId('  D125  ');
      expect(res3.valid).toBe(true);
      expect(res3.normalized).toBe('D125');
    });

    it('rejects invalid Delivery Boy ID formats (d01, D0001, DEL001, DABC)', () => {
      expect(validateDeliveryBoyId('d01').valid).toBe(false);
      expect(validateDeliveryBoyId('D0001').valid).toBe(false);
      expect(validateDeliveryBoyId('DEL001').valid).toBe(false);
      expect(validateDeliveryBoyId('DABC').valid).toBe(false);
      expect(validateDeliveryBoyId('001').valid).toBe(false);
      expect(validateDeliveryBoyId('').valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. CRYPTOGRAPHIC HASHING & TIMING-SAFE VERIFICATION
  // --------------------------------------------------------------------------
  describe('Cryptographic PIN Hashing & Security', () => {
    it('generates a secure salted scrypt hash', () => {
      const hash1 = hashPin('7941');
      const hash2 = hashPin('7941');

      // Different salts produce different hashes for the same PIN
      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain(':');
      expect(hash1.split(':')[0].length).toBe(32); // 16 bytes hex salt
    });

    it('verifies correct PIN against stored hash', () => {
      const hash = hashPin('5821');
      expect(verifyPin('5821', hash)).toBe(true);
      expect(verifyPin('0000', hash)).toBe(false);
      expect(verifyPin('5822', hash)).toBe(false);
    });

    it('performs dummy comparison safely on null or invalid hash', () => {
      expect(verifyPin('1234', null)).toBe(false);
      expect(verifyPin('1234', undefined)).toBe(false);
      expect(verifyPin('1234', 'invalid-format')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. ADMIN CREDENTIAL MANAGEMENT (CUSTOMERS & DELIVERY BOYS)
  // --------------------------------------------------------------------------
  describe('Admin Customer and Delivery Boy Management', () => {
    it('admin creates customer with unique Login ID and 4-digit PIN hash', () => {
      const uniqueLoginId = `9999${Date.now()}`.slice(0, 10);
      const pin = '4821';
      const pinHash = hashPin(pin);

      const customer = dataService.createCustomer({
        name: 'Ganesh Kadam',
        phone: '+91 9822998877',
        address: 'Sector 5, Swapna Nagari',
        area: 'Shivaji Nagar',
        status: 'ACTIVE',
        start_date: '2026-09-01',
        advance_balance: 0,
        login_id: uniqueLoginId,
        pin_hash: pinHash,
        login_enabled: true,
      });

      expect(customer.login_id).toBe(uniqueLoginId);
      expect(customer.pin_hash).toBe(pinHash);
      expect(customer.login_enabled).toBe(true);
      expect(customer.pin_hash).not.toBe(pin); // Never plaintext
      expect(verifyPin(pin, customer.pin_hash)).toBe(true);
    });

    it('prevents duplicate customer Login IDs', () => {
      const duplicateId = '88888888';
      dataService.createCustomer({
        name: 'User A',
        phone: '+91 9822888881',
        address: 'Address A',
        area: 'Shivaji Nagar',
        status: 'ACTIVE',
        start_date: '2026-09-01',
        advance_balance: 0,
        login_id: duplicateId,
        pin_hash: hashPin('1111'),
      });

      expect(() => {
        dataService.createCustomer({
          name: 'User B',
          phone: '+91 9822888882',
          address: 'Address B',
          area: 'Shivaji Nagar',
          status: 'ACTIVE',
          start_date: '2026-09-01',
          advance_balance: 0,
          login_id: duplicateId,
          pin_hash: hashPin('2222'),
        });
      }).toThrow('Customer Login ID is already in use');
    });

    it('admin resets customer PIN securely', () => {
      const cust = dataService.getCustomers()[0];
      const newPin = '3344';
      const newHash = hashPin(newPin);

      const updated = dataService.updateCustomer(cust.id, {
        pin_hash: newHash,
      });

      expect(verifyPin(newPin, updated.pin_hash)).toBe(true);
      expect(verifyPin('1234', updated.pin_hash)).toBe(false);
      expect(updated.pin_updated_at).toBeDefined();
    });

    it('admin creates delivery boy with D-format ID and 4-digit PIN', () => {
      const staffId = `D${Math.floor(100 + Math.random() * 899)}`;
      const pin = '9876';

      const boy = dataService.createDeliveryBoy({
        name: 'Nitin Pawar',
        phone: '+91 9822000099',
        area: 'Station Road',
        is_active: true,
        login_id: staffId,
        pin_hash: hashPin(pin),
        login_enabled: true,
      });

      expect(boy.login_id).toBe(staffId);
      expect(verifyPin(pin, boy.pin_hash)).toBe(true);
      expect(boy.login_enabled).toBe(true);
    });

    it('prevents duplicate delivery staff IDs', () => {
      expect(() => {
        dataService.createDeliveryBoy({
          name: 'Duplicate Staff',
          phone: '+91 9822000088',
          area: 'Station Road',
          is_active: true,
          login_id: 'D001', // Already belongs to Ramesh Shinde
          pin_hash: hashPin('1234'),
        });
      }).toThrow('already assigned');
    });
  });

  // --------------------------------------------------------------------------
  // 4. RATE LIMITING & LOCKOUT
  // --------------------------------------------------------------------------
  describe('Account Lockout & Brute-Force Rate Limiting', () => {
    it('locks customer account after 5 consecutive failed login attempts', () => {
      const cust = dataService.getCustomers()[1];
      dataService.resetCustomerFailedAttempts(cust.id);

      for (let i = 1; i <= 4; i++) {
        const attempt = dataService.recordFailedCustomerLogin(cust.id);
        expect(attempt.locked).toBe(false);
        expect(attempt.remainingAttempts).toBe(5 - i);
      }

      // 5th attempt triggers lockout
      const finalAttempt = dataService.recordFailedCustomerLogin(cust.id);
      expect(finalAttempt.locked).toBe(true);
      expect(finalAttempt.remainingAttempts).toBe(0);
      expect(finalAttempt.lockedUntil).toBeDefined();

      const freshCust = dataService.getCustomerById(cust.id);
      expect(freshCust?.locked_until).toBeDefined();
    });

    it('locks delivery staff account after 5 consecutive failed login attempts', () => {
      const boy = dataService.getDeliveryBoys()[0];
      dataService.resetDeliveryBoyFailedAttempts(boy.id);

      for (let i = 1; i <= 4; i++) {
        const attempt = dataService.recordFailedDeliveryBoyLogin(boy.id);
        expect(attempt.locked).toBe(false);
      }

      const lockAttempt = dataService.recordFailedDeliveryBoyLogin(boy.id);
      expect(lockAttempt.locked).toBe(true);
      expect(lockAttempt.lockedUntil).toBeDefined();

      // Reset restores access
      dataService.resetDeliveryBoyFailedAttempts(boy.id);
      const freshBoy = dataService.getDeliveryBoyById(boy.id);
      expect(freshBoy?.locked_until).toBeNull();
      expect(freshBoy?.failed_login_attempts).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. ROLE-BASED ACCESS & SECURITY BOUNDARIES
  // --------------------------------------------------------------------------
  describe('Role-Based Access Boundaries', () => {
    it('delivery boys have no access to customer bills or financial statements', () => {
      const bills = dataService.getBills();
      expect(bills.length).toBeGreaterThan(0);

      // Customer bills only belong to customer accounts
      for (const bill of bills) {
        expect(bill.customer_id).toBeDefined();
        // Delivery boy ID is not allowed on bill records
        expect((bill as any).delivery_boy_id).toBeUndefined();
      }
    });

    it('customer accounts cannot see another customer bills', () => {
      const cust1 = dataService.getCustomers()[0];
      const cust2 = dataService.getCustomers()[1];

      const billsCust1 = dataService.getBills(undefined, cust1.id);
      const billsCust2 = dataService.getBills(undefined, cust2.id);

      // Every bill for cust1 strictly matches cust1.id
      for (const b of billsCust1) {
        expect(b.customer_id).toBe(cust1.id);
        expect(b.customer_id).not.toBe(cust2.id);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 6. MULTILINGUAL i18n INTEGRITY
  // --------------------------------------------------------------------------
  describe('Multilingual i18n Dictionary Integrity for Authentication', () => {
    it('has all required auth keys across English, Marathi, and Hindi', () => {
      const requiredKeys = [
        'auth.adminTab',
        'auth.customerTab',
        'auth.deliveryTab',
        'auth.customerLoginId',
        'auth.deliveryStaffId',
        'auth.pinLabel',
        'auth.showPin',
        'auth.hidePin',
        'auth.forgotPin',
        'auth.signIn',
      ];

      for (const key of requiredKeys) {
        expect(en[key], `Missing English key: ${key}`).toBeDefined();
        expect(mr[key], `Missing Marathi key: ${key}`).toBeDefined();
        expect(hi[key], `Missing Hindi key: ${key}`).toBeDefined();
      }
    });
  });
});
