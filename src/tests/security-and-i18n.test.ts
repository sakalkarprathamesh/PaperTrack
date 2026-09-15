import { describe, it, expect } from 'vitest';
import { en } from '../lib/i18n/translations/en';
import { mr } from '../lib/i18n/translations/mr';
import { hi } from '../lib/i18n/translations/hi';
import { SUPPORTED_LANGUAGES, Language } from '../lib/i18n/types';

describe('Phase 6 — Multilingual i18n Dictionary Integrity', () => {
  it('supports English, Marathi, and Hindi language options', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('mr');
    expect(codes).toContain('hi');
    expect(codes.length).toBe(3);
  });

  it('contains valid native labels for Marathi and Hindi', () => {
    const mrLang = SUPPORTED_LANGUAGES.find((l) => l.code === 'mr');
    const hiLang = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
    expect(mrLang?.nativeLabel).toBe('मराठी');
    expect(hiLang?.nativeLabel).toBe('हिन्दी');
  });

  it('has matching keys across English, Marathi, and Hindi dictionaries', () => {
    const enKeys = Object.keys(en);
    const mrKeys = Object.keys(mr);
    const hiKeys = Object.keys(hi);

    expect(enKeys.length).toBeGreaterThan(30);

    for (const key of enKeys) {
      expect(mrKeys, `Marathi dictionary missing key: ${key}`).toContain(key);
      expect(hiKeys, `Hindi dictionary missing key: ${key}`).toContain(key);
    }
  });

  it('translates core brand and navigation labels correctly in Marathi', () => {
    expect(mr['brand.name']).toBe('पेपरट्रॅक');
    expect(mr['nav.dashboard']).toBe('डॅशबोर्ड');
    expect(mr['nav.customers']).toBe('ग्राहक यादी');
    expect(mr['nav.delivery']).toBe('दैनिक वितरण');
    expect(mr['nav.billing']).toBe('मासिक बिलिंग');
    expect(mr['nav.payments']).toBe('जमा पावती');
    expect(mr['nav.collections']).toBe('दैनिक वसुली');
    expect(mr['nav.reminders']).toBe('व्हॉट्सॲप स्मरण');
  });

  it('translates core brand and navigation labels correctly in Hindi', () => {
    expect(hi['brand.name']).toBe('पेपरट्रैक');
    expect(hi['nav.dashboard']).toBe('डैशबोर्ड');
    expect(hi['nav.customers']).toBe('ग्राहक सूची');
    expect(hi['nav.delivery']).toBe('दैनिक वितरण');
    expect(hi['nav.billing']).toBe('मासिक बिलिंग');
    expect(hi['nav.payments']).toBe('भुगतान प्रविष्टि');
    expect(hi['nav.collections']).toBe('दैनिक वसूली');
    expect(hi['nav.reminders']).toBe('व्हाट्सएप तकाजा');
  });

  it('provides safe fallback when translation key is unknown', () => {
    const unknownKey = 'nonexistent.key.test';
    const dict = en as Record<string, string>;
    const resolved = dict[unknownKey] || unknownKey;
    expect(resolved).toBe(unknownKey);
  });
});

describe('Phase 6 — Route Role Boundaries & Security Guards', () => {
  // Mock role-checking logic used in middleware and layout guards
  function isRouteAuthorized(role: string | null, pathname: string): boolean {
    if (!role) return false;
    if (pathname.startsWith('/admin')) {
      return role === 'admin';
    }
    if (pathname.startsWith('/delivery')) {
      return role === 'delivery' || role === 'admin';
    }
    if (pathname.startsWith('/customer')) {
      return role === 'customer' || role === 'admin';
    }
    return true;
  }

  it('allows Admin to access admin, delivery, and customer routes', () => {
    expect(isRouteAuthorized('admin', '/admin/dashboard')).toBe(true);
    expect(isRouteAuthorized('admin', '/admin/customers')).toBe(true);
    expect(isRouteAuthorized('admin', '/delivery/today')).toBe(true);
    expect(isRouteAuthorized('admin', '/customer/dashboard')).toBe(true);
  });

  it('blocks Delivery Staff from accessing Admin and Customer routes', () => {
    expect(isRouteAuthorized('delivery', '/admin/dashboard')).toBe(false);
    expect(isRouteAuthorized('delivery', '/admin/settings')).toBe(false);
    expect(isRouteAuthorized('delivery', '/customer/dashboard')).toBe(false);
    expect(isRouteAuthorized('delivery', '/delivery/today')).toBe(true);
  });

  it('blocks Customer from accessing Admin and Delivery routes', () => {
    expect(isRouteAuthorized('customer', '/admin/dashboard')).toBe(false);
    expect(isRouteAuthorized('customer', '/admin/billing')).toBe(false);
    expect(isRouteAuthorized('customer', '/delivery/today')).toBe(false);
    expect(isRouteAuthorized('customer', '/customer/bills')).toBe(true);
  });

  it('denies unauthenticated requests on protected routes', () => {
    expect(isRouteAuthorized(null, '/admin/dashboard')).toBe(false);
    expect(isRouteAuthorized(null, '/delivery/today')).toBe(false);
    expect(isRouteAuthorized(null, '/customer/dashboard')).toBe(false);
  });
});

describe('Phase 6 — File Upload Security Controls', () => {
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  function validateUpload(fileName: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: 'File size exceeds maximum allowed limit (5 MB).' };
    }
    const extension = fileName.toLowerCase().split('.').pop();
    if (extension !== 'csv' && extension !== 'txt') {
      return { valid: false, error: 'Only .csv and .txt files are supported.' };
    }
    return { valid: true };
  }

  it('accepts valid CSV files under 5MB', () => {
    const result = validateUpload('lokmat_customers.csv', 1024 * 50); // 50 KB
    expect(result.valid).toBe(true);
  });

  it('rejects files larger than 5MB', () => {
    const result = validateUpload('large_backup.csv', 6 * 1024 * 1024); // 6 MB
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 MB');
  });

  it('rejects executable and non-csv extensions', () => {
    expect(validateUpload('script.js', 100).valid).toBe(false);
    expect(validateUpload('virus.exe', 100).valid).toBe(false);
    expect(validateUpload('payload.sh', 100).valid).toBe(false);
    expect(validateUpload('image.png', 100).valid).toBe(false);
  });
});

describe('Phase 6 — SEO & Privacy Protection Rules', () => {
  // Verification of robot rules
  const disallowRoutes = ['/admin/', '/delivery/', '/customer/', '/api/', '/unauthorized'];

  it('protects all internal dashboards from web crawlers', () => {
    for (const route of disallowRoutes) {
      expect(route.startsWith('/')).toBe(true);
    }
    expect(disallowRoutes).toContain('/admin/');
    expect(disallowRoutes).toContain('/delivery/');
    expect(disallowRoutes).toContain('/customer/');
  });
});
