import { describe, it, expect } from 'vitest';
import { allocatePayment } from '../lib/billing-engine';

describe('Payment Allocation Detailed Scenarios', () => {
  it('handles exact payment matching bill amount', () => {
    const bill = {
      id: 'b-exact',
      billing_month: '2026-08',
      total_due: 155.00,
      paid_amount: 0.00,
      remaining_amount: 155.00,
      status: 'PENDING' as const,
    };

    const result = allocatePayment({
      paymentAmount: 155.00,
      outstandingBills: [bill],
    });

    expect(result.allocations[0].newRemainingAmount).toBe(0.00);
    expect(result.allocations[0].newStatus).toBe('CLEARED');
    expect(result.newAdvanceBalance).toBe(0.00);
  });

  it('allocates payment across 3 consecutive months properly', () => {
    const bills = [
      {
        id: 'b-may',
        billing_month: '2026-05',
        total_due: 150.00,
        paid_amount: 100.00,
        remaining_amount: 50.00, // May remaining: ₹50
        status: 'PARTIAL' as const,
      },
      {
        id: 'b-jun',
        billing_month: '2026-06',
        total_due: 150.00,
        paid_amount: 0.00,
        remaining_amount: 150.00, // June remaining: ₹150
        status: 'PENDING' as const,
      },
      {
        id: 'b-jul',
        billing_month: '2026-07',
        total_due: 155.00,
        paid_amount: 0.00,
        remaining_amount: 155.00, // July remaining: ₹155
        status: 'PENDING' as const,
      },
    ];

    // Customer pays ₹250
    // May needs 50 -> Cleared (200 left)
    // June needs 150 -> Cleared (50 left)
    // July gets 50 -> Remaining 105, Partial (0 left)
    const result = allocatePayment({
      paymentAmount: 250.00,
      outstandingBills: bills,
    });

    expect(result.allocations).toHaveLength(3);
    expect(result.allocations[0].billId).toBe('b-may');
    expect(result.allocations[0].allocatedAmount).toBe(50.00);
    expect(result.allocations[0].newStatus).toBe('CLEARED');

    expect(result.allocations[1].billId).toBe('b-jun');
    expect(result.allocations[1].allocatedAmount).toBe(150.00);
    expect(result.allocations[1].newStatus).toBe('CLEARED');

    expect(result.allocations[2].billId).toBe('b-jul');
    expect(result.allocations[2].allocatedAmount).toBe(50.00);
    expect(result.allocations[2].newRemainingAmount).toBe(105.00);
    expect(result.allocations[2].newStatus).toBe('PARTIAL');

    expect(result.newAdvanceBalance).toBe(0.00);
  });
});
