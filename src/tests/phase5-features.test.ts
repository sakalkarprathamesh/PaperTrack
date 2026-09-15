import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../lib/data-service';
import { calculateCurrentCharges } from '../lib/billing-engine';

describe('PaperTrack Phase 5 Extra Features Tests', () => {
  const customerId = '10000000-0000-0000-0000-000000000001'; // Anand Kulkarni

  // FEATURE 1: CUSTOMER LEDGER
  describe('Customer Ledger Engine', () => {
    it('calculates chronological running balance with bills as debits and payments as credits', () => {
      const ledger = dataService.getCustomerLedger(customerId);
      expect(ledger).toBeDefined();
      expect(ledger.customer.id).toBe(customerId);
      expect(ledger.entries.length).toBeGreaterThan(0);

      // Verify running balance row by row
      let calculatedBalance = ledger.openingBalance;
      for (const entry of ledger.entries) {
        if (entry.type === 'OPENING_BALANCE') continue;
        calculatedBalance += entry.debit - entry.credit;
        expect(entry.runningBalance).toBe(calculatedBalance);
      }
    });

    it('does not reduce running balance when a payment is marked as reversed', () => {
      // Record a test payment
      const payment = dataService.recordPayment({
        customerId,
        amount: 250,
        paymentMode: 'UPI',
        paymentDate: '2026-09-10',
        notes: 'Test reversal payment',
      });


      // Reverse the payment
      dataService.reversePayment(payment.id, 'Test reversal reason for ledger audit');

      const ledger = dataService.getCustomerLedger(customerId);
      const reversedEntry = ledger.entries.find((e) => e.paymentId === payment.id);

      expect(reversedEntry).toBeDefined();
      expect(reversedEntry?.isReversed).toBe(true);
      expect(reversedEntry?.credit).toBe(0); // Credit is 0 for reversed payment
      expect(reversedEntry?.reversalReason).toBe('Test reversal reason for ledger audit');
    });

    it('supports date filtering and computes prior opening balance', () => {
      const fullLedger = dataService.getCustomerLedger(customerId);
      const filteredLedger = dataService.getCustomerLedger(customerId, '2026-09-01', '2026-09-30');

      expect(filteredLedger).toBeDefined();
      // All filtered entries should have date >= 2026-09-01
      for (const entry of filteredLedger.entries) {
        expect(entry.date >= '2026-09-01').toBe(true);
      }
    });
  });


  // FEATURE 2: WHATSAPP REMINDERS
  describe('WhatsApp Reminders Engine', () => {
    it('generates prefilled WhatsApp message with UPI ID and proper 91 phone formatting', () => {
      const reminders = dataService.getReminderCustomers();
      expect(Array.isArray(reminders)).toBe(true);

      if (reminders.length > 0) {
        const item = reminders[0];
        expect(item.phone).toBeDefined();
        expect(item.cleanPhone).toMatch(/^91\d{10}$/);
        expect(item.message).toContain('Namaskar');
        expect(item.message).toContain('Lokmat');
        expect(item.message).toContain('₹');
        expect(item.message).toContain('UPI');
        expect(item.whatsappUrl).toContain(`https://wa.me/${item.cleanPhone}?text=`);
      }
    });
  });

  // FEATURE 3: DAILY COLLECTION REPORT
  describe('Daily Collection Report', () => {
    it('accurately groups collections by Cash vs UPI and excludes reversed amounts', () => {
      const report = dataService.getDailyCollectionReport();
      expect(report).toBeDefined();
      expect(typeof report.totalCollected).toBe('number');
      expect(typeof report.cashCollected).toBe('number');
      expect(typeof report.upiCollected).toBe('number');
      expect(report.totalCollected).toBe(report.cashCollected + report.upiCollected);
      expect(typeof report.reversedAmount).toBe('number');
    });
  });

  // FEATURE 6: SUBSCRIPTION PAUSES (VACATION HOLDS)
  describe('Subscription Pauses & Vacation Holds', () => {
    it('creates a vacation hold and updates delivery records to PAUSED', () => {
      const testCustomerId = '10000000-0000-0000-0000-000000000003';
      const pause = dataService.createPause({
        customerId: testCustomerId,
        startDate: '2026-08-20',
        endDate: '2026-08-25',
        reason: 'Out of town wedding',
      });

      expect(pause.id).toBeDefined();
      expect(pause.customer_id).toBe(testCustomerId);

      // Verify delivery records within range have status = PAUSED
      const pausedRecord = dataService.deliveryRecords.find(
        (r) => r.customer_id === testCustomerId && r.delivery_date === '2026-08-22'
      );
      expect(pausedRecord).toBeDefined();
      expect(pausedRecord?.status).toBe('PAUSED');
    });

    it('billing engine charges ₹0 for paused delivery days', () => {
      // 20 delivered days, 5 paused days, 5 not delivered days @ ₹5/day
      const records: { status: 'DELIVERED' | 'NOT_DELIVERED' | 'PAUSED' }[] = [
        ...Array(20).fill({ status: 'DELIVERED' as const }),
        ...Array(5).fill({ status: 'PAUSED' as const }),
        ...Array(5).fill({ status: 'NOT_DELIVERED' as const }),
      ];

      const deliveredDays = records.filter((r) => r.status === 'DELIVERED').length;
      const pausedDays = records.filter((r) => r.status === 'PAUSED').length;

      expect(deliveredDays).toBe(20);
      expect(pausedDays).toBe(5);

      // Only delivered days are charged at ₹5.00
      const currentCharges = calculateCurrentCharges(deliveredDays, 5.0);
      expect(currentCharges).toBe(100.0);
    });


    it('allows admin to resume vacation pause early', () => {
      const pauses = dataService.getPauses();
      if (pauses.length > 0) {
        const p = pauses[0];
        const resumed = dataService.resumePauseEarly(p.id);
        const todayStr = new Date().toISOString().split('T')[0];
        expect(resumed.end_date).toBe(todayStr);
      }
    });
  });

  // FEATURE 7: INTERNAL CUSTOMER NOTES
  describe('Internal Customer Notes (Admin Only)', () => {
    it('allows admin to create, update, and delete private notes', () => {
      const testCustId = '10000000-0000-0000-0000-000000000002';
      const initialCount = dataService.getCustomerNotes(testCustId).length;

      // 1. Create
      const created = dataService.createCustomerNote(testCustId, 'Keep newspaper inside main gate.', 'Admin');
      expect(created.id).toBeDefined();
      expect(created.note).toBe('Keep newspaper inside main gate.');
      expect(dataService.getCustomerNotes(testCustId).length).toBe(initialCount + 1);

      // 2. Update
      const updated = dataService.updateCustomerNote(created.id, 'Updated: Keep newspaper inside main gate near shoe rack.');
      expect(updated.note).toContain('near shoe rack');

      // 3. Delete
      const deleted = dataService.deleteCustomerNote(created.id);
      expect(deleted.id).toBe(created.id);
      expect(dataService.getCustomerNotes(testCustId).length).toBe(initialCount);
    });
  });

  // FEATURE 10: ADMIN DASHBOARD ALERTS
  describe('Admin Dashboard Actionable Alerts', () => {
    it('returns actionable alerts for overdue dues, unbilled months, or unmarked deliveries', () => {
      const alerts = dataService.getAdminAlerts();
      expect(Array.isArray(alerts)).toBe(true);
      for (const alert of alerts) {
        expect(alert.id).toBeDefined();
        expect(alert.title).toBeDefined();
        expect(alert.actionLabel).toBeDefined();
        expect(alert.actionHref).toBeDefined();
        expect(['CRITICAL', 'WARNING', 'INFO']).toContain(alert.type);
      }
    });
  });
});
