// TypeScript types for PaperTrack

export type UserRole = 'ADMIN' | 'DELIVERY_BOY' | 'CUSTOMER';
export type CustomerStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type DeliveryStatus = 'DELIVERED' | 'NOT_DELIVERED' | 'PAUSED';
export type BillStatus = 'PENDING' | 'PARTIAL' | 'CLEARED';
export type PaymentMode = 'CASH' | 'UPI';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DeliveryBoy {
  id: string;
  profile_id?: string | null;
  name: string;
  phone: string;
  area: string;
  is_active: boolean;
  login_id?: string;
  pin_hash?: string;
  login_enabled?: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
  pin_updated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  profile_id?: string | null;
  name: string;
  phone: string;
  address: string;
  area: string;
  delivery_boy_id?: string | null;
  status: CustomerStatus;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  advance_balance: number;
  login_id?: string;
  pin_hash?: string;
  login_enabled?: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
  pin_updated_at?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  delivery_boy?: DeliveryBoy | null;
  current_balance?: number;
  latest_bill_status?: BillStatus | null;
}

export interface Newspaper {
  id: string;
  name: string;
  language: string;
  default_daily_rate: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  newspaper_id: string;
  daily_rate: number;
  start_date: string;
  end_date?: string | null;
  status: SubscriptionStatus;
  newspaper?: Newspaper;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryRecord {
  id: string;
  customer_id: string;
  subscription_id: string;
  delivery_date: string; // YYYY-MM-DD
  status: DeliveryStatus;
  marked_by?: string | null;
  marked_at?: string;
  notes?: string | null;
  customer?: Customer;
}

export interface Bill {
  id: string;
  customer_id: string;
  billing_month: string; // YYYY-MM
  previous_balance: number;
  current_charges: number;
  total_due: number;
  paid_amount: number;
  remaining_amount: number;
  status: BillStatus;
  generated_at: string;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  bill_items?: BillItem[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  subscription_id: string;
  description: string;
  delivered_days: number;
  daily_rate: number;
  amount: number;
  created_at?: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_date: string;
  upi_reference?: string | null;
  receipt_number: string;
  notes?: string | null;
  recorded_by?: string | null;
  is_reversed: boolean;
  reversal_reason?: string | null;
  reversed_at?: string | null;
  reversed_by?: string | null;
  created_at?: string;
  customer?: Customer;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  bill_id: string;
  allocated_amount: number;
  bill?: Bill;
}

export interface AgencySettings {
  id: number;
  agency_name: string;
  agency_phone: string;
  agency_address: string;
  default_daily_rate: number;
  receipt_prefix: string;
  upi_id?: string | null;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by?: string | null;
  details?: Record<string, any>;
  created_at: string;
}

// Phase 5 Extra Interfaces

export interface CustomerNote {
  id: string;
  customer_id: string;
  note: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPause {
  id: string;
  customer_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason: string;
  created_by?: string | null;
  created_at: string;
}

export type LedgerEntryType = 'OPENING_BALANCE' | 'BILL' | 'PAYMENT' | 'REVERSAL';

export interface LedgerEntry {
  id: string;
  date: string;
  type: LedgerEntryType;
  description: string;
  debit: number; // Bill amount
  credit: number; // Payment amount
  runningBalance: number;
  paymentMode?: PaymentMode | null;
  reference?: string | null; // Receipt # or Bill month
  billId?: string | null;
  paymentId?: string | null;
  isReversed?: boolean;
  reversalReason?: string | null;
}

export interface CollectionTransaction {
  id: string;
  time: string;
  date: string;
  customerId: string;
  customerName: string;
  area: string;
  amount: number;
  mode: PaymentMode;
  receiptNumber: string;
  recordedBy?: string | null;
  status: 'COMPLETED' | 'REVERSED';
  reversalReason?: string | null;
}

export interface CollectionReport {
  date: string;
  totalCollected: number;
  cashCollected: number;
  upiCollected: number;
  paymentCount: number;
  reversedCount: number;
  reversedAmount: number;
  transactions: CollectionTransaction[];
}

export interface AdminAlert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  description: string;
  count: number;
  actionLabel: string;
  actionHref: string;
}

export interface GlobalSearchResult {
  customers: {
    id: string;
    name: string;
    phone: string;
    area: string;
    current_balance: number;
    status: CustomerStatus;
  }[];
  receipts: {
    id: string;
    receiptNumber: string;
    customerName: string;
    amount: number;
    mode: PaymentMode;
    date: string;
    isReversed: boolean;
  }[];
}

