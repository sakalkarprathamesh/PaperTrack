import { describe, it, expect } from 'vitest';
import {
  calculateCurrentCharges,
  determineBillStatus,
  calculateBillTotals,
  allocatePayment,
  reversePaymentAllocation,
} from '../lib/billing-engine';

describe('Billing Engine: Daily Charges Calculation', () => {
  it('calculates charges correctly for 30 delivered days at standard rate ₹5', () => {
    const charges = calculateCurrentCharges(30, 5.00);
    expect(charges).toBe(150.00);
  });

  it('calculates charges correctly for 31 days at ₹5', () => {
    const charges = calculateCurrentCharges(31, 5.00);
    expect(charges).toBe(155.00);
  });

  it('returns ₹0 when zero days were delivered', () => {
    const charges = calculateCurrentCharges(0, 5.00);
    expect(charges).toBe(0.00);
  });

  it('throws error for negative days or rates', () => {
    expect(() => calculateCurrentCharges(-1, 5.00)).toThrow();
    expect(() => calculateCurrentCharges(10, -5.00)).toThrow();
  });
});

describe('Billing Engine: Bill Status Determination', () => {
  it('returns PENDING when paid is 0 and remaining is positive', () => {
    expect(determineBillStatus(0, 150)).toBe('PENDING');
  });

  it('returns PARTIAL when paid is positive and remaining is positive', () => {
    expect(determineBillStatus(50, 100)).toBe('PARTIAL');
  });

  it('returns CLEARED when remaining is 0 or less', () => {
    expect(determineBillStatus(150, 0)).toBe('CLEARED');
    expect(determineBillStatus(200, -50)).toBe('CLEARED');
  });
});

describe('Billing Engine: Bill Totals & Carry Forward', () => {
  it('adds carry-forward previous balance to current charges', () => {
    const totals = calculateBillTotals({
      previousBalance: 120.00,
      currentCharges: 155.00,
    });
    expect(totals.totalDue).toBe(275.00);
    expect(totals.remainingAmount).toBe(275.00);
    expect(totals.status).toBe('PENDING');
  });

  it('deducts available advance credit from total due', () => {
    const totals = calculateBillTotals({
      previousBalance: 0,
      currentCharges: 150.00,
      advanceCreditApplied: 50.00,
    });
    expect(totals.totalDue).toBe(100.00);
    expect(totals.remainingAmount).toBe(100.00);
    expect(totals.status).toBe('PARTIAL');
  });

  it('marks bill CLEARED if advance credit completely covers charges', () => {
    const totals = calculateBillTotals({
      previousBalance: 0,
      currentCharges: 150.00,
      advanceCreditApplied: 150.00,
    });
    expect(totals.totalDue).toBe(0.00);
    expect(totals.remainingAmount).toBe(0.00);
    expect(totals.status).toBe('CLEARED');
  });
});

describe('Billing Engine: Payment Allocation', () => {
  it('allocates partial payment to a single bill', () => {
    const bill = {
      id: 'b-1',
      billing_month: '2026-08',
      total_due: 155.00,
      paid_amount: 0.00,
      remaining_amount: 155.00,
      status: 'PENDING' as const,
    };

    const result = allocatePayment({
      paymentAmount: 100.00,
      outstandingBills: [bill],
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].allocatedAmount).toBe(100.00);
    expect(result.allocations[0].newPaidAmount).toBe(100.00);
    expect(result.allocations[0].newRemainingAmount).toBe(55.00);
    expect(result.allocations[0].newStatus).toBe('PARTIAL');
    expect(result.newAdvanceBalance).toBe(0.00);
  });

  it('allocates payment across multiple bills in chronological order (oldest first)', () => {
    const julyBill = {
      id: 'b-july',
      billing_month: '2026-07',
      total_due: 150.00,
      paid_amount: 50.00,
      remaining_amount: 100.00,
      status: 'PARTIAL' as const,
    };

    const augustBill = {
      id: 'b-aug',
      billing_month: '2026-08',
      total_due: 155.00,
      paid_amount: 0.00,
      remaining_amount: 155.00,
      status: 'PENDING' as const,
    };

    // Even if passed out of order, it must sort by month ascending
    const result = allocatePayment({
      paymentAmount: 180.00,
      outstandingBills: [augustBill, julyBill],
    });

    expect(result.allocations).toHaveLength(2);
    // Oldest bill (July) gets ₹100 to clear it
    expect(result.allocations[0].billId).toBe('b-july');
    expect(result.allocations[0].allocatedAmount).toBe(100.00);
    expect(result.allocations[0].newRemainingAmount).toBe(0.00);
    expect(result.allocations[0].newStatus).toBe('CLEARED');

    // Newer bill (August) gets the remaining ₹80
    expect(result.allocations[1].billId).toBe('b-aug');
    expect(result.allocations[1].allocatedAmount).toBe(80.00);
    expect(result.allocations[1].newRemainingAmount).toBe(75.00);
    expect(result.allocations[1].newStatus).toBe('PARTIAL');
    expect(result.newAdvanceBalance).toBe(0.00);
  });

  it('credits excess payment amount to advance balance without losing any money', () => {
    const bill = {
      id: 'b-1',
      billing_month: '2026-08',
      total_due: 150.00,
      paid_amount: 0.00,
      remaining_amount: 150.00,
      status: 'PENDING' as const,
    };

    const result = allocatePayment({
      paymentAmount: 200.00,
      outstandingBills: [bill],
      currentAdvanceBalance: 10.00,
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].allocatedAmount).toBe(150.00);
    expect(result.allocations[0].newStatus).toBe('CLEARED');
    // ₹200 - ₹150 = ₹50 excess + previous ₹10 advance = ₹60 advance balance
    expect(result.newAdvanceBalance).toBe(60.00);
  });

  it('throws error when payment amount is zero or negative', () => {
    expect(() =>
      allocatePayment({
        paymentAmount: 0,
        outstandingBills: [],
      })
    ).toThrow();
  });
});

describe('Billing Engine: Payment Reversal', () => {
  it('reverses payment allocations and re-opens the bill', () => {
    const bill = {
      id: 'b-1',
      total_due: 155.00,
      paid_amount: 100.00,
      remaining_amount: 55.00,
    };

    const reversal = reversePaymentAllocation({
      paymentAmount: 100.00,
      allocations: [{ billId: 'b-1', allocatedAmount: 100.00 }],
      bills: [bill],
      currentAdvanceBalance: 0.00,
    });

    expect(reversal.updatedBills).toHaveLength(1);
    expect(reversal.updatedBills[0].newPaidAmount).toBe(0.00);
    expect(reversal.updatedBills[0].newRemainingAmount).toBe(155.00);
    expect(reversal.updatedBills[0].newStatus).toBe('PENDING');
  });

  it('deducts the advance balance when an overpayment is reversed', () => {
    const bill = {
      id: 'b-1',
      total_due: 150.00,
      paid_amount: 150.00,
      remaining_amount: 0.00,
    };

    // Customer originally paid ₹200 for a ₹150 bill.
    // ₹150 was allocated to b-1, ₹50 was put in advance balance.
    const reversal = reversePaymentAllocation({
      paymentAmount: 200.00,
      allocations: [{ billId: 'b-1', allocatedAmount: 150.00 }],
      bills: [bill],
      currentAdvanceBalance: 50.00,
    });

    expect(reversal.updatedBills[0].newPaidAmount).toBe(0.00);
    expect(reversal.updatedBills[0].newRemainingAmount).toBe(150.00);
    expect(reversal.updatedBills[0].newStatus).toBe('PENDING');
    // Advance balance of ₹50 is subtracted back to ₹0
    expect(reversal.newAdvanceBalance).toBe(0.00);
  });
});
