import { Bill, BillStatus, Payment, PaymentAllocation } from './types';

/**
 * Utility to round monetary amounts to 2 decimal places to avoid floating point issues.
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates current charges for a given number of delivered days and daily rate.
 */
export function calculateCurrentCharges(deliveredDays: number, dailyRate: number): number {
  if (deliveredDays < 0 || dailyRate < 0) {
    throw new Error('Delivered days and daily rate must be non-negative');
  }
  return roundMoney(deliveredDays * dailyRate);
}

/**
 * Determines bill status based on paid amount and remaining amount.
 */
export function determineBillStatus(paidAmount: number, remainingAmount: number): BillStatus {
  const roundedRemaining = roundMoney(remainingAmount);
  const roundedPaid = roundMoney(paidAmount);

  if (roundedRemaining <= 0) {
    return 'CLEARED';
  }
  if (roundedPaid > 0 && roundedRemaining > 0) {
    return 'PARTIAL';
  }
  return 'PENDING';
}

/**
 * Calculates bill financial totals incorporating carry-forward balance and advance credit.
 */
export function calculateBillTotals(params: {
  previousBalance: number;
  currentCharges: number;
  advanceCreditApplied?: number;
}): {
  totalDue: number;
  remainingAmount: number;
  status: BillStatus;
} {
  const prev = roundMoney(Math.max(0, params.previousBalance));
  const current = roundMoney(params.currentCharges);
  const advance = roundMoney(Math.max(0, params.advanceCreditApplied || 0));

  const rawTotalDue = roundMoney(prev + current);
  const totalDue = roundMoney(Math.max(0, rawTotalDue - advance));
  const remainingAmount = totalDue;
  const status = determineBillStatus(advance, remainingAmount);

  return {
    totalDue,
    remainingAmount,
    status,
  };
}

export interface PaymentAllocationResult {
  allocations: {
    billId: string;
    allocatedAmount: number;
    newPaidAmount: number;
    newRemainingAmount: number;
    newStatus: BillStatus;
  }[];
  newAdvanceBalance: number;
  totalAllocated: number;
}

/**
 * Pure function to allocate a payment to outstanding bills in chronological order (oldest first).
 * Excess payment is credited to the customer's advance balance.
 */
export function allocatePayment(params: {
  paymentAmount: number;
  outstandingBills: Pick<Bill, 'id' | 'billing_month' | 'total_due' | 'paid_amount' | 'remaining_amount' | 'status'>[];
  currentAdvanceBalance?: number;
}): PaymentAllocationResult {
  if (params.paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  let unallocated = roundMoney(params.paymentAmount);
  let advance = roundMoney(params.currentAdvanceBalance || 0);
  const allocations: PaymentAllocationResult['allocations'] = [];

  // Sort bills oldest to newest (by billing_month ascending)
  const sortedBills = [...params.outstandingBills].sort((a, b) =>
    a.billing_month.localeCompare(b.billing_month)
  );

  for (const bill of sortedBills) {
    if (unallocated <= 0) break;

    const remainingOnBill = roundMoney(bill.remaining_amount);
    if (remainingOnBill <= 0) continue;

    const amountToAllocate = roundMoney(Math.min(unallocated, remainingOnBill));
    const newPaidAmount = roundMoney(bill.paid_amount + amountToAllocate);
    const newRemainingAmount = roundMoney(bill.total_due - newPaidAmount);
    const newStatus = determineBillStatus(newPaidAmount, newRemainingAmount);

    allocations.push({
      billId: bill.id,
      allocatedAmount: amountToAllocate,
      newPaidAmount,
      newRemainingAmount,
      newStatus,
    });

    unallocated = roundMoney(unallocated - amountToAllocate);
  }

  // Any remaining payment after clearing all outstanding bills goes to advance balance
  const newAdvanceBalance = roundMoney(advance + unallocated);
  const totalAllocated = roundMoney(params.paymentAmount - unallocated);

  return {
    allocations,
    newAdvanceBalance,
    totalAllocated,
  };
}

/**
 * Reverses a payment and recalculates the affected bills and customer advance balance.
 */
export function reversePaymentAllocation(params: {
  paymentAmount: number;
  allocations: { billId: string; allocatedAmount: number }[];
  bills: Pick<Bill, 'id' | 'total_due' | 'paid_amount' | 'remaining_amount'>[];
  currentAdvanceBalance: number;
}): {
  updatedBills: {
    billId: string;
    newPaidAmount: number;
    newRemainingAmount: number;
    newStatus: BillStatus;
  }[];
  newAdvanceBalance: number;
} {
  let advance = roundMoney(params.currentAdvanceBalance);
  let totalAllocatedToBills = 0;

  const billMap = new Map(params.bills.map((b) => [b.id, b]));
  const updatedBills: {
    billId: string;
    newPaidAmount: number;
    newRemainingAmount: number;
    newStatus: BillStatus;
  }[] = [];

  for (const alloc of params.allocations) {
    const bill = billMap.get(alloc.billId);
    if (!bill) continue;

    totalAllocatedToBills = roundMoney(totalAllocatedToBills + alloc.allocatedAmount);
    const newPaidAmount = roundMoney(Math.max(0, bill.paid_amount - alloc.allocatedAmount));
    const newRemainingAmount = roundMoney(bill.total_due - newPaidAmount);
    const newStatus = determineBillStatus(newPaidAmount, newRemainingAmount);

    updatedBills.push({
      billId: bill.id,
      newPaidAmount,
      newRemainingAmount,
      newStatus,
    });
  }

  // Any amount from the payment that was credited to advance must be deducted
  const unallocatedPortionOfPayment = roundMoney(params.paymentAmount - totalAllocatedToBills);
  const newAdvanceBalance = roundMoney(Math.max(0, advance - unallocatedPortionOfPayment));

  return {
    updatedBills,
    newAdvanceBalance,
  };
}
