import {
  Customer,
  DeliveryBoy,
  Bill,
  Payment,
  DeliveryRecord,
  Subscription,
  AgencySettings,
  AuditLog,
  DeliveryStatus,
  PaymentMode,
  CustomerNote,
  SubscriptionPause,
  LedgerEntry,
  CollectionReport,
  CollectionTransaction,
  AdminAlert,
  GlobalSearchResult,
} from './types';
import {
  initialCustomers,
  initialDeliveryBoys,
  initialBills,
  initialPayments,
  initialSubscriptions,
  initialSettings,
  initialNewspapers,
} from './seed-data';
import {
  calculateCurrentCharges,
  calculateBillTotals,
  allocatePayment,
  reversePaymentAllocation,
} from './billing-engine';
import { generateReceiptNumber } from './utils';

// State container for in-memory / prototype runtime
class DataStore {
  customers: Customer[] = [...initialCustomers];
  deliveryBoys: DeliveryBoy[] = [...initialDeliveryBoys];
  subscriptions: Subscription[] = [...initialSubscriptions];
  bills: Bill[] = [...initialBills];
  payments: Payment[] = [...initialPayments];
  deliveryRecords: DeliveryRecord[] = [];
  settings: AgencySettings = { ...initialSettings };
  auditLogs: AuditLog[] = [];
  customerNotes: CustomerNote[] = [];
  subscriptionPauses: SubscriptionPause[] = [];

  constructor() {
    this.seedDefaultDeliveries();
    this.seedPhase5Data();
  }


  private seedDefaultDeliveries() {
    // Generate sample delivery records for August 2026 (1st to 31st)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const daysInCurrentMonth = today.getDate();

    // Create delivery records for the active customers
    for (const cust of this.customers) {
      if (cust.status === 'CANCELLED') continue;

      const sub = this.subscriptions.find((s) => s.customer_id === cust.id);
      if (!sub) continue;

      // Seed for August 2026
      for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
        // Give Anand Kulkarni 30 days delivered, 1 day not delivered
        let status: DeliveryStatus = 'DELIVERED';
        if (cust.name === 'Anand Kulkarni' && day === 15) status = 'NOT_DELIVERED';
        if (cust.name === 'Prakash Joshi' && day > 28) status = 'NOT_DELIVERED';
        if (cust.status === 'PAUSED' && day > 10) status = 'PAUSED';

        this.deliveryRecords.push({
          id: `del-aug-${cust.id}-${day}`,
          customer_id: cust.id,
          subscription_id: sub.id,
          delivery_date: dateStr,
          status,
          marked_by: cust.delivery_boy_id || null,
          marked_at: `${dateStr}T06:30:00Z`,
        });
      }

      // Seed for current date / September 2026
      for (let day = 1; day <= Math.min(daysInCurrentMonth, 15); day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        this.deliveryRecords.push({
          id: `del-cur-${cust.id}-${day}`,
          customer_id: cust.id,
          subscription_id: sub.id,
          delivery_date: dateStr,
          status: 'DELIVERED',
          marked_by: cust.delivery_boy_id || null,
          marked_at: `${dateStr}T06:15:00Z`,
        });
      }
    }
  }

  private seedPhase5Data() {
    // 1. Seed Customer Internal Notes
    this.customerNotes = [
      {
        id: 'note-1',
        customer_id: '10000000-0000-0000-0000-000000000001',
        note: 'Prefers morning delivery before 6:30 AM on front porch. Very punctual with monthly UPI payments.',
        created_by: 'Admin',
        created_at: '2026-08-01T08:00:00Z',
        updated_at: '2026-08-01T08:00:00Z',
      },
      {
        id: 'note-2',
        customer_id: '10000000-0000-0000-0000-000000000002',
        note: 'Keep newspaper near shoe rack. Front gate has pet dog - please do not enter compound if gate is latched.',
        created_by: 'Admin',
        created_at: '2026-08-05T09:30:00Z',
        updated_at: '2026-08-05T09:30:00Z',
      },
      {
        id: 'note-3',
        customer_id: '10000000-0000-0000-0000-000000000003',
        note: 'Call customer son on 1st of month for UPI collection. Prefers receipt sent on WhatsApp.',
        created_by: 'Admin',
        created_at: '2026-08-10T11:00:00Z',
        updated_at: '2026-08-10T11:00:00Z',
      },
    ];

    // 2. Seed Subscription Pauses (Vacation Holds)
    this.subscriptionPauses = [
      {
        id: 'pause-1',
        customer_id: '10000000-0000-0000-0000-000000000004',
        start_date: '2026-08-10',
        end_date: '2026-08-20',
        reason: 'Family vacation to Goa',
        created_by: 'Admin',
        created_at: '2026-08-08T10:00:00Z',
      },
    ];

    // Mark delivery records during pause period as PAUSED
    for (let day = 10; day <= 20; day++) {
      const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
      const rec = this.deliveryRecords.find(
        (r) => r.customer_id === '10000000-0000-0000-0000-000000000004' && r.delivery_date === dateStr
      );
      if (rec) {
        rec.status = 'PAUSED';
        rec.notes = 'Paused: Vacation Hold';
      }
    }

    // 3. Seed Audit Logs
    this.auditLogs = [
      {
        id: 'audit-1',
        entity_type: 'CUSTOMER',
        entity_id: '10000000-0000-0000-0000-000000000001',
        action: 'CREATE_CUSTOMER',
        performed_by: 'Admin',
        details: { name: 'Anand Kulkarni', area: 'Shivaji Nagar', phone: '+91 9822111001' },
        created_at: '2026-08-01T05:30:00Z',
      },
      {
        id: 'audit-2',
        entity_type: 'BILL',
        entity_id: 'bill-batch-2026-08',
        action: 'GENERATE_MONTHLY_BILLS',
        performed_by: 'Admin',
        details: { billingMonth: '2026-08', billsGenerated: 10, totalCharges: 1515 },
        created_at: '2026-09-01T06:00:00Z',
      },
      {
        id: 'audit-3',
        entity_type: 'PAYMENT',
        entity_id: 'pay-001',
        action: 'RECORD_PAYMENT',
        performed_by: 'Admin',
        details: { receiptNumber: 'REC-202609-0001', customerName: 'Anand Kulkarni', amount: 150, mode: 'UPI' },
        created_at: '2026-09-02T09:15:00Z',
      },
      {
        id: 'audit-4',
        entity_type: 'SUBSCRIPTION_PAUSE',
        entity_id: 'pause-1',
        action: 'CREATE_PAUSE',
        performed_by: 'Admin',
        details: { customerName: 'Rajesh Patil', startDate: '2026-08-10', endDate: '2026-08-20', reason: 'Family vacation to Goa' },
        created_at: '2026-08-08T10:00:00Z',
      },
      {
        id: 'audit-5',
        entity_type: 'CUSTOMER_NOTE',
        entity_id: 'note-1',
        action: 'CREATE_NOTE',
        performed_by: 'Admin',
        details: { customerName: 'Anand Kulkarni', noteSummary: 'Prefers morning delivery before 6:30 AM' },
        created_at: '2026-08-01T08:00:00Z',
      },
    ];
  }


  // CUSTOMERS
  getCustomers(search?: string, area?: string, deliveryBoyId?: string, statusFilter?: string) {
    let result = [...this.customers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q)
      );
    }

    if (area && area !== 'ALL') {
      result = result.filter((c) => c.area === area);
    }

    if (deliveryBoyId && deliveryBoyId !== 'ALL') {
      result = result.filter((c) => c.delivery_boy_id === deliveryBoyId);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'CLEARED') {
        result = result.filter((c) => (c.current_balance || 0) <= 0);
      } else if (statusFilter === 'PENDING') {
        result = result.filter((c) => (c.current_balance || 0) > 0);
      } else {
        result = result.filter((c) => c.status === statusFilter);
      }
    }

    // Attach delivery boy details & recalculate live current balance
    return result.map((c) => {
      const dboy = this.deliveryBoys.find((b) => b.id === c.delivery_boy_id) || null;
      const unpaidBills = this.bills.filter((b) => b.customer_id === c.id);
      const totalRemaining = unpaidBills.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);
      const latestBill = unpaidBills.sort((a, b) => b.billing_month.localeCompare(a.billing_month))[0];

      return {
        ...c,
        delivery_boy: dboy,
        current_balance: Math.max(0, totalRemaining - (c.advance_balance || 0)),
        latest_bill_status: latestBill ? latestBill.status : (c.advance_balance > 0 ? 'CLEARED' : null),
      };
    });
  }

  getCustomerById(id: string): Customer | null {
    const cust = this.customers.find((c) => c.id === id);
    if (!cust) return null;

    const dboy = this.deliveryBoys.find((b) => b.id === cust.delivery_boy_id) || null;
    const custBills = this.bills.filter((b) => b.customer_id === cust.id);
    const totalRemaining = custBills.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);

    return {
      ...cust,
      delivery_boy: dboy,
      current_balance: Math.max(0, totalRemaining - (cust.advance_balance || 0)),
    };
  }

  createCustomer(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & { initial_daily_rate?: number }) {
    const mobileDigits = (data.phone || '').replace(/\D/g, '');
    const mobile10 = mobileDigits.length >= 10 ? mobileDigits.slice(-10) : '';

    if (mobile10) {
      const existingPhone = this.customers.find((c) => {
        const cPhone10 = (c.phone || '').replace(/\D/g, '').slice(-10);
        const cLogin10 = (c.login_id || '').replace(/\D/g, '').slice(-10);
        return cPhone10 === mobile10 || cLogin10 === mobile10;
      });
      if (existingPhone) {
        throw new Error('Customer mobile number is already registered to another subscriber');
      }
    }

    const assignedLoginId = data.login_id ? data.login_id.trim() : (mobile10 || undefined);

    if (assignedLoginId) {
      const cleanLoginId = assignedLoginId.trim();
      const existing = this.customers.find((c) => c.login_id === cleanLoginId);
      if (existing) {
        throw new Error('Customer Login ID is already in use by another subscriber');
      }
    }

    const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCustomer: Customer = {
      ...data,
      id,
      login_id: assignedLoginId,
      pin_hash: data.pin_hash,
      login_enabled: data.login_enabled !== undefined ? data.login_enabled : true,
      failed_login_attempts: 0,
      locked_until: null,
      pin_updated_at: data.pin_hash ? new Date().toISOString() : undefined,
      advance_balance: data.advance_balance || 0.0,
      current_balance: 0.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.customers.push(newCustomer);

    // Create default Lokmat subscription
    const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.subscriptions.push({
      id: subId,
      customer_id: id,
      newspaper_id: '11111111-1111-1111-1111-111111111111',
      daily_rate: data.initial_daily_rate || this.settings.default_daily_rate || 5.0,
      start_date: data.start_date,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'CUSTOMER',
      entity_id: id,
      action: 'CREATE',
      details: { name: newCustomer.name, phone: newCustomer.phone, login_id: newCustomer.login_id },
      created_at: new Date().toISOString(),
    });

    return newCustomer;
  }

  updateCustomer(id: string, updates: Partial<Customer>) {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');

    if (updates.phone) {
      const mobileDigits = updates.phone.replace(/\D/g, '');
      const mobile10 = mobileDigits.length >= 10 ? mobileDigits.slice(-10) : '';
      if (mobile10) {
        const existingPhone = this.customers.find((c) => {
          if (c.id === id) return false;
          const cPhone10 = (c.phone || '').replace(/\D/g, '').slice(-10);
          const cLogin10 = (c.login_id || '').replace(/\D/g, '').slice(-10);
          return cPhone10 === mobile10 || cLogin10 === mobile10;
        });
        if (existingPhone) {
          throw new Error('Customer mobile number is already registered to another subscriber');
        }
        if (!updates.login_id) {
          updates.login_id = mobile10;
        }
      }
    }

    if (updates.login_id) {
      const cleanLoginId = updates.login_id.trim();
      const existing = this.customers.find((c) => c.login_id === cleanLoginId && c.id !== id);
      if (existing) {
        throw new Error('Customer Login ID is already in use by another subscriber');
      }
      updates.login_id = cleanLoginId;
    }

    if (updates.pin_hash) {
      updates.pin_updated_at = new Date().toISOString();
      updates.failed_login_attempts = 0;
      updates.locked_until = null;
    }

    this.customers[idx] = {
      ...this.customers[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If status changed to paused or cancelled, update subscription status
    if (updates.status) {
      const subIdx = this.subscriptions.findIndex((s) => s.customer_id === id);
      if (subIdx !== -1) {
        this.subscriptions[subIdx].status = updates.status === 'PAUSED' ? 'PAUSED' : (updates.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE');
      }
    }

    return this.customers[idx];
  }

  getCustomerByLoginId(loginId: string): Customer | null {
    if (!loginId) return null;
    const clean = loginId.trim();
    const cleanDigits = clean.replace(/\D/g, '');
    const clean10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    return this.customers.find((c) => {
      // 1. Direct login_id match
      if (c.login_id === clean || c.login_id === cleanDigits) return true;

      // 2. 10-digit mobile match against login_id or phone
      if (clean10 && clean10.length === 10) {
        if (c.login_id) {
          const cLoginDigits = c.login_id.replace(/\D/g, '');
          if (cLoginDigits.endsWith(clean10)) return true;
        }
        if (c.phone) {
          const cPhoneDigits = c.phone.replace(/\D/g, '');
          if (cPhoneDigits.endsWith(clean10)) return true;
        }
      }

      return false;
    }) || null;
  }

  recordFailedCustomerLogin(customerId: string): { locked: boolean; remainingAttempts: number; lockedUntil?: string } {
    const idx = this.customers.findIndex((c) => c.id === customerId);
    if (idx === -1) return { locked: false, remainingAttempts: 0 };

    const fails = (this.customers[idx].failed_login_attempts || 0) + 1;
    this.customers[idx].failed_login_attempts = fails;

    if (fails >= 5) {
      const lockoutMinutes = 15;
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString();
      this.customers[idx].locked_until = lockedUntil;
      return { locked: true, remainingAttempts: 0, lockedUntil };
    }

    return { locked: false, remainingAttempts: Math.max(0, 5 - fails) };
  }

  resetCustomerFailedAttempts(customerId: string): void {
    const idx = this.customers.findIndex((c) => c.id === customerId);
    if (idx !== -1) {
      this.customers[idx].failed_login_attempts = 0;
      this.customers[idx].locked_until = null;
    }
  }

  // DELIVERY BOYS
  getDeliveryBoys() {
    return this.deliveryBoys.map((boy) => {
      const assignedCount = this.customers.filter((c) => c.delivery_boy_id === boy.id && c.status === 'ACTIVE').length;
      return {
        ...boy,
        assigned_customer_count: assignedCount,
      };
    });
  }

  getDeliveryBoyById(id: string) {
    return this.deliveryBoys.find((b) => b.id === id) || null;
  }

  getDeliveryBoyByLoginId(loginId: string): DeliveryBoy | null {
    const clean = loginId.trim().toUpperCase();
    return this.deliveryBoys.find((b) => b.login_id?.toUpperCase() === clean) || null;
  }

  createDeliveryBoy(data: Omit<DeliveryBoy, 'id' | 'created_at' | 'updated_at'>) {
    if (data.login_id) {
      const cleanLoginId = data.login_id.trim().toUpperCase();
      const existing = this.deliveryBoys.find((b) => b.login_id?.toUpperCase() === cleanLoginId);
      if (existing) {
        throw new Error(`Delivery Staff ID ${cleanLoginId} is already assigned`);
      }
    }

    const id = `dboy-${Date.now()}`;
    const newBoy: DeliveryBoy = {
      ...data,
      id,
      login_id: data.login_id ? data.login_id.trim().toUpperCase() : undefined,
      pin_hash: data.pin_hash,
      login_enabled: data.login_enabled !== undefined ? data.login_enabled : true,
      failed_login_attempts: 0,
      locked_until: null,
      pin_updated_at: data.pin_hash ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.deliveryBoys.push(newBoy);
    return newBoy;
  }

  updateDeliveryBoy(id: string, updates: Partial<DeliveryBoy>) {
    const idx = this.deliveryBoys.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Delivery boy not found');

    if (updates.login_id) {
      const cleanLoginId = updates.login_id.trim().toUpperCase();
      const existing = this.deliveryBoys.find((b) => b.login_id?.toUpperCase() === cleanLoginId && b.id !== id);
      if (existing) {
        throw new Error(`Delivery Staff ID ${cleanLoginId} is already assigned to another staff member`);
      }
      updates.login_id = cleanLoginId;
    }

    if (updates.pin_hash) {
      updates.pin_updated_at = new Date().toISOString();
      updates.failed_login_attempts = 0;
      updates.locked_until = null;
    }

    this.deliveryBoys[idx] = {
      ...this.deliveryBoys[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.deliveryBoys[idx];
  }

  recordFailedDeliveryBoyLogin(deliveryBoyId: string): { locked: boolean; remainingAttempts: number; lockedUntil?: string } {
    const idx = this.deliveryBoys.findIndex((b) => b.id === deliveryBoyId);
    if (idx === -1) return { locked: false, remainingAttempts: 0 };

    const fails = (this.deliveryBoys[idx].failed_login_attempts || 0) + 1;
    this.deliveryBoys[idx].failed_login_attempts = fails;

    if (fails >= 5) {
      const lockoutMinutes = 15;
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString();
      this.deliveryBoys[idx].locked_until = lockedUntil;
      return { locked: true, remainingAttempts: 0, lockedUntil };
    }

    return { locked: false, remainingAttempts: Math.max(0, 5 - fails) };
  }

  resetDeliveryBoyFailedAttempts(deliveryBoyId: string): void {
    const idx = this.deliveryBoys.findIndex((b) => b.id === deliveryBoyId);
    if (idx !== -1) {
      this.deliveryBoys[idx].failed_login_attempts = 0;
      this.deliveryBoys[idx].locked_until = null;
    }
  }

  // SUBSCRIPTIONS
  getSubscriptions(customerId?: string) {
    if (customerId) {
      return this.subscriptions.filter((s) => s.customer_id === customerId);
    }
    return this.subscriptions;
  }

  // DELIVERY RECORDS & DAILY DESK
  getDailyDeliveries(date: string, deliveryBoyId?: string, area?: string) {
    // Get all active customers
    let targetCustomers = this.customers.filter((c) => c.status !== 'CANCELLED');

    if (deliveryBoyId && deliveryBoyId !== 'ALL') {
      targetCustomers = targetCustomers.filter((c) => c.delivery_boy_id === deliveryBoyId);
    }

    if (area && area !== 'ALL') {
      targetCustomers = targetCustomers.filter((c) => c.area === area);
    }

    return targetCustomers.map((cust) => {
      const sub = this.subscriptions.find((s) => s.customer_id === cust.id);
      const record = this.deliveryRecords.find(
        (r) => r.customer_id === cust.id && r.delivery_date === date
      );

      return {
        customer: cust,
        subscription: sub,
        delivery_date: date,
        status: record ? record.status : ('PENDING' as DeliveryStatus | 'PENDING'),
        record_id: record ? record.id : null,
        notes: record?.notes || '',
      };
    });
  }

  markDelivery(params: {
    customerId: string;
    deliveryDate: string;
    status: DeliveryStatus;
    markedBy?: string;
    notes?: string;
  }) {
    const sub = this.subscriptions.find((s) => s.customer_id === params.customerId);
    if (!sub) throw new Error('No active subscription found for customer');

    // Duplicate check: Look for existing record on this day
    const existingIdx = this.deliveryRecords.findIndex(
      (r) => r.customer_id === params.customerId && r.delivery_date === params.deliveryDate
    );

    if (existingIdx !== -1) {
      // Update existing
      this.deliveryRecords[existingIdx].status = params.status;
      this.deliveryRecords[existingIdx].marked_at = new Date().toISOString();
      this.deliveryRecords[existingIdx].marked_by = params.markedBy || null;
      if (params.notes !== undefined) this.deliveryRecords[existingIdx].notes = params.notes;
      return this.deliveryRecords[existingIdx];
    } else {
      // Insert new record
      const newRecord: DeliveryRecord = {
        id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        customer_id: params.customerId,
        subscription_id: sub.id,
        delivery_date: params.deliveryDate,
        status: params.status,
        marked_by: params.markedBy || null,
        marked_at: new Date().toISOString(),
        notes: params.notes || null,
      };
      this.deliveryRecords.push(newRecord);
      return newRecord;
    }
  }

  bulkMarkDeliveries(params: {
    customerIds: string[];
    deliveryDate: string;
    status: DeliveryStatus;
    markedBy?: string;
  }) {
    let count = 0;
    for (const cid of params.customerIds) {
      this.markDelivery({
        customerId: cid,
        deliveryDate: params.deliveryDate,
        status: params.status,
        markedBy: params.markedBy,
      });
      count++;
    }
    return { success: true, count };
  }

  // BILLING ENGINE
  getBills(month?: string, customerId?: string, status?: string) {
    let result = [...this.bills];

    if (month && month !== 'ALL') {
      result = result.filter((b) => b.billing_month === month);
    }
    if (customerId) {
      result = result.filter((b) => b.customer_id === customerId);
    }
    if (status && status !== 'ALL') {
      result = result.filter((b) => b.status === status);
    }

    return result.map((b) => {
      const cust = this.customers.find((c) => c.id === b.customer_id);
      return {
        ...b,
        customer: cust,
      };
    });
  }

  getBillById(id: string): Bill | null {
    const bill = this.bills.find((b) => b.id === id);
    if (!bill) return null;
    const cust = this.customers.find((c) => c.id === bill.customer_id);
    return {
      ...bill,
      customer: cust,
    };
  }

  generateMonthlyBills(billingMonth: string) {
    // Check if bills already exist for this month
    const existing = this.bills.filter((b) => b.billing_month === billingMonth);
    const existingCustomerIds = new Set(existing.map((b) => b.customer_id));

    let createdCount = 0;
    let skippedCount = 0;

    for (const customer of this.customers) {
      if (customer.status === 'CANCELLED') continue;

      if (existingCustomerIds.has(customer.id)) {
        skippedCount++;
        continue;
      }

      const sub = this.subscriptions.find((s) => s.customer_id === customer.id);
      if (!sub) continue;

      // Count actual delivered days for billing month (e.g. '2026-08')
      const monthDeliveries = this.deliveryRecords.filter(
        (r) =>
          r.customer_id === customer.id &&
          r.delivery_date.startsWith(billingMonth) &&
          r.status === 'DELIVERED'
      );

      const deliveredDays = monthDeliveries.length;
      const rate = sub.daily_rate || this.settings.default_daily_rate || 5.0;
      const currentCharges = calculateCurrentCharges(deliveredDays, rate);

      // Find previous unpaid balance
      const priorBills = this.bills.filter(
        (b) => b.customer_id === customer.id && b.billing_month < billingMonth
      );
      const previousBalance = priorBills.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);

      // Check customer advance credit
      const advanceBalance = customer.advance_balance || 0;
      const advanceToApply = Math.min(advanceBalance, previousBalance + currentCharges);

      const billTotals = calculateBillTotals({
        previousBalance,
        currentCharges,
        advanceCreditApplied: advanceToApply,
      });

      const billId = `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newBill: Bill = {
        id: billId,
        customer_id: customer.id,
        billing_month: billingMonth,
        previous_balance: previousBalance,
        current_charges: currentCharges,
        total_due: previousBalance + currentCharges,
        paid_amount: advanceToApply,
        remaining_amount: billTotals.remainingAmount,
        status: billTotals.status,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bill_items: [
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            bill_id: billId,
            subscription_id: sub.id,
            description: `Lokmat (Daily Newspaper) - ${billingMonth}`,
            delivered_days: deliveredDays,
            daily_rate: rate,
            amount: currentCharges,
          },
        ],
      };

      this.bills.push(newBill);

      // If advance credit was applied, deduct it from customer's advance balance
      if (advanceToApply > 0) {
        customer.advance_balance = Math.max(0, customer.advance_balance - advanceToApply);
      }

      createdCount++;
    }

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'BILL',
      entity_id: billingMonth,
      action: 'GENERATE_MONTHLY_BILLS',
      details: { month: billingMonth, createdCount, skippedCount },
      created_at: new Date().toISOString(),
    });

    return { createdCount, skippedCount };
  }

  // PAYMENTS & ALLOCATIONS
  getPayments(customerId?: string) {
    let list = [...this.payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date));
    if (customerId) {
      list = list.filter((p) => p.customer_id === customerId);
    }
    return list.map((p) => {
      const cust = this.customers.find((c) => c.id === p.customer_id);
      return {
        ...p,
        customer: cust,
      };
    });
  }

  recordPayment(params: {
    customerId: string;
    amount: number;
    paymentMode: PaymentMode;
    paymentDate: string;
    upiReference?: string;
    notes?: string;
    recordedBy?: string;
  }) {
    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const customer = this.customers.find((c) => c.id === params.customerId);
    if (!customer) throw new Error('Customer not found');

    // Find outstanding bills ordered by billing_month ascending (oldest first)
    const outstandingBills = this.bills
      .filter((b) => b.customer_id === params.customerId && b.remaining_amount > 0)
      .sort((a, b) => a.billing_month.localeCompare(b.billing_month));

    const allocationResult = allocatePayment({
      paymentAmount: params.amount,
      outstandingBills,
      currentAdvanceBalance: customer.advance_balance || 0,
    });

    // Generate unique receipt number
    const receiptNumber = generateReceiptNumber(this.settings.receipt_prefix || 'REC-');
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Create payment record
    const newPayment: Payment = {
      id: paymentId,
      customer_id: params.customerId,
      amount: params.amount,
      payment_mode: params.paymentMode,
      payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
      upi_reference: params.upiReference || null,
      receipt_number: receiptNumber,
      notes: params.notes || null,
      recorded_by: params.recordedBy || null,
      is_reversed: false,
      created_at: new Date().toISOString(),
      allocations: allocationResult.allocations.map((a) => ({
        id: `alloc-${Date.now()}-${a.billId}`,
        payment_id: paymentId,
        bill_id: a.billId,
        allocated_amount: a.allocatedAmount,
      })),
    };

    this.payments.push(newPayment);

    // Apply updates to affected bills
    for (const alloc of allocationResult.allocations) {
      const bill = this.bills.find((b) => b.id === alloc.billId);
      if (bill) {
        bill.paid_amount = alloc.newPaidAmount;
        bill.remaining_amount = alloc.newRemainingAmount;
        bill.status = alloc.newStatus;
        bill.updated_at = new Date().toISOString();
      }
    }

    // Update customer advance balance
    customer.advance_balance = allocationResult.newAdvanceBalance;

    // Log to audit
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'PAYMENT',
      entity_id: paymentId,
      action: 'RECORD_PAYMENT',
      details: {
        receiptNumber,
        amount: params.amount,
        mode: params.paymentMode,
        allocationsCount: allocationResult.allocations.length,
        newAdvanceBalance: customer.advance_balance,
      },
      created_at: new Date().toISOString(),
    });

    return newPayment;
  }

  reversePayment(paymentId: string, reason: string, reversedBy?: string) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reversal reason is mandatory');
    }

    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.is_reversed) throw new Error('Payment is already reversed');

    const customer = this.customers.find((c) => c.id === payment.customer_id);
    if (!customer) throw new Error('Customer not found');

    const allocations = payment.allocations || [];
    const affectedBillIds = allocations.map((a) => a.bill_id);
    const affectedBills = this.bills.filter((b) => affectedBillIds.includes(b.id));

    const reversalResult = reversePaymentAllocation({
      paymentAmount: payment.amount,
      allocations: allocations.map((a) => ({ billId: a.bill_id, allocatedAmount: a.allocated_amount })),
      bills: affectedBills,
      currentAdvanceBalance: customer.advance_balance || 0,
    });

    // Update bills
    for (const updated of reversalResult.updatedBills) {
      const bill = this.bills.find((b) => b.id === updated.billId);
      if (bill) {
        bill.paid_amount = updated.newPaidAmount;
        bill.remaining_amount = updated.newRemainingAmount;
        bill.status = updated.newStatus;
        bill.updated_at = new Date().toISOString();
      }
    }

    // Update customer advance balance
    customer.advance_balance = reversalResult.newAdvanceBalance;

    // Mark payment reversed
    payment.is_reversed = true;
    payment.reversal_reason = reason;
    payment.reversed_at = new Date().toISOString();
    payment.reversed_by = reversedBy || null;

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'PAYMENT',
      entity_id: paymentId,
      action: 'REVERSE_PAYMENT',
      details: {
        receiptNumber: payment.receipt_number,
        amount: payment.amount,
        reason,
        reversedBy,
      },
      created_at: new Date().toISOString(),
    });

    return payment;
  }

  // DASHBOARD KPIS
  getAdminDashboardStats() {
    const activeCustomers = this.customers.filter((c) => c.status === 'ACTIVE').length;
    const todayStr = new Date().toISOString().split('T')[0];

    const todayRecords = this.deliveryRecords.filter((r) => r.delivery_date === todayStr);
    const todayDelivered = todayRecords.filter((r) => r.status === 'DELIVERED').length;

    // Total outstanding balance across all unpaid bills
    const totalOutstanding = this.bills.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);

    // Current month collection (Cash vs UPI)
    const currentMonthStr = todayStr.substring(0, 7); // 'YYYY-MM'
    const validMonthPayments = this.payments.filter(
      (p) => !p.is_reversed && p.payment_date.startsWith(currentMonthStr)
    );

    const cashCollection = validMonthPayments
      .filter((p) => p.payment_mode === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);

    const upiCollection = validMonthPayments
      .filter((p) => p.payment_mode === 'UPI')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalCollection = cashCollection + upiCollection;

    // Cleared vs Pending customers count
    const customerBalances = this.getCustomers();
    const clearedCustomers = customerBalances.filter((c) => (c.current_balance || 0) <= 0).length;
    const pendingCustomers = customerBalances.filter((c) => (c.current_balance || 0) > 0).length;

    const recentPayments = this.getPayments().slice(0, 5);

    return {
      activeCustomers,
      todayDelivered,
      todayTotalActive: activeCustomers,
      totalOutstanding,
      cashCollection,
      upiCollection,
      totalCollection,
      clearedCustomers,
      pendingCustomers,
      recentPayments,
    };
  }

  getDeliveryBoyDashboardStats(deliveryBoyId: string) {
    const assignedCustomers = this.customers.filter(
      (c) => c.delivery_boy_id === deliveryBoyId && c.status === 'ACTIVE'
    );
    const todayStr = new Date().toISOString().split('T')[0];

    const todayRecords = this.deliveryRecords.filter(
      (r) =>
        r.delivery_date === todayStr &&
        assignedCustomers.some((c) => c.id === r.customer_id)
    );

    const completed = todayRecords.filter((r) => r.status === 'DELIVERED').length;
    const remaining = Math.max(0, assignedCustomers.length - completed);

    return {
      assignedCustomerCount: assignedCustomers.length,
      todayDeliveredCount: completed,
      remainingCount: remaining,
      todayRecords,
    };
  }

  getCustomerDashboardStats(customerId: string) {
    const cust = this.getCustomerById(customerId);
    const bills = this.getBills(undefined, customerId);
    const payments = this.getPayments(customerId);
    const latestBill = bills.sort((a, b) => b.billing_month.localeCompare(a.billing_month))[0] || null;
    const lastPayment = payments.filter((p) => !p.is_reversed)[0] || null;

    return {
      customer: cust,
      currentBalance: cust?.current_balance || 0,
      advanceBalance: cust?.advance_balance || 0,
      latestBill,
      lastPayment,
      totalBills: bills.length,
      totalPayments: payments.length,
    };
  }

  // AGENCY SETTINGS
  getAgencySettings() {
    return this.settings;
  }

  updateAgencySettings(updates: Partial<AgencySettings>) {
    this.settings = {
      ...this.settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.settings;
  }

  // ==========================================================================
  // PHASE 5 EXTRA FEATURES
  // ==========================================================================

  // FEATURE 1: CUSTOMER LEDGER
  getCustomerLedger(customerId: string, startDate?: string, endDate?: string) {
    const customer = this.getCustomerById(customerId);
    if (!customer) throw new Error('Customer not found');

    const customerBills = this.bills
      .filter((b) => b.customer_id === customerId)
      .sort((a, b) => a.billing_month.localeCompare(b.billing_month));

    const customerPayments = this.payments
      .filter((p) => p.customer_id === customerId)
      .sort((a, b) => a.payment_date.localeCompare(b.payment_date));

    type RawItem = {
      date: string;
      type: 'BILL' | 'PAYMENT';
      description: string;
      debit: number;
      credit: number;
      paymentMode?: PaymentMode | null;
      reference?: string | null;
      billId?: string | null;
      paymentId?: string | null;
      isReversed?: boolean;
      reversalReason?: string | null;
      sortOrder: number;
    };

    const rawItems: RawItem[] = [];
    let order = 0;

    for (const b of customerBills) {
      const billDate = b.generated_at ? b.generated_at.split('T')[0] : `${b.billing_month}-01`;
      const deliveredDays = b.bill_items?.[0]?.delivered_days ?? 30;
      rawItems.push({
        date: billDate,
        type: 'BILL',
        description: `Lokmat Bill for ${b.billing_month} (${deliveredDays} delivered days @ ₹5)`,
        debit: b.current_charges,
        credit: 0,
        reference: b.billing_month,
        billId: b.id,
        sortOrder: order++,
      });
    }

    for (const p of customerPayments) {
      rawItems.push({
        date: p.payment_date,
        type: 'PAYMENT',
        description: p.is_reversed
          ? `Payment Received [REVERSED: ${p.reversal_reason || 'Reversed by admin'}]`
          : `Payment Received (${p.payment_mode})`,
        debit: 0,
        credit: p.is_reversed ? 0 : p.amount,
        paymentMode: p.payment_mode,
        reference: p.receipt_number,
        paymentId: p.id,
        isReversed: p.is_reversed,
        reversalReason: p.reversal_reason,
        sortOrder: order++,
      });
    }

    // Sort chronologically ascending
    rawItems.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      if (a.type === 'BILL' && b.type === 'PAYMENT') return -1;
      if (a.type === 'PAYMENT' && b.type === 'BILL') return 1;
      return a.sortOrder - b.sortOrder;
    });

    let openingBalance = 0;
    const filteredItems: RawItem[] = [];

    for (const item of rawItems) {
      if (startDate && item.date < startDate) {
        openingBalance += item.debit - item.credit;
      } else if (!endDate || item.date <= endDate) {
        filteredItems.push(item);
      }
    }

    let runningBalance = openingBalance;
    let totalBilled = 0;
    let totalPaid = 0;

    const entries: LedgerEntry[] = [];

    if (startDate && openingBalance !== 0) {
      entries.push({
        id: `open-${startDate}`,
        date: startDate,
        type: 'OPENING_BALANCE',
        description: `Opening Balance (Prior to ${startDate})`,
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        runningBalance: openingBalance,
        reference: 'BAL-FWD',
      });
    }

    for (const item of filteredItems) {
      runningBalance += item.debit - item.credit;
      totalBilled += item.debit;
      totalPaid += item.credit;

      entries.push({
        id: item.type === 'BILL' ? `led-bill-${item.billId}` : `led-pay-${item.paymentId}`,
        date: item.date,
        type: item.type,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
        runningBalance,
        paymentMode: item.paymentMode,
        reference: item.reference,
        billId: item.billId,
        paymentId: item.paymentId,
        isReversed: item.isReversed,
        reversalReason: item.reversalReason,
      });
    }

    return {
      customer,
      openingBalance,
      entries,
      runningBalance,
      advanceBalance: customer.advance_balance || 0,
      currentBalance: customer.current_balance || 0,
      totalBilled,
      totalPaid,
    };
  }

  // FEATURE 2: WHATSAPP PAYMENT REMINDERS
  getReminderCustomers(area?: string, minDue = 0) {
    const allCustomers = this.getCustomers(undefined, area === 'ALL' ? undefined : area);
    const agency = this.getAgencySettings();

    const dueCustomers = allCustomers
      .filter((c) => (c.current_balance || 0) > minDue)
      .map((c) => {
        const custBills = this.bills
          .filter((b) => b.customer_id === c.id && b.remaining_amount > 0)
          .sort((a, b) => b.billing_month.localeCompare(a.billing_month));
        const latestMonth = custBills[0]?.billing_month || 'Current';

        // Clean phone number: remove non-digits, ensure 91 prefix for 10-digit Indian numbers
        const rawDigits = c.phone.replace(/\D/g, '');
        const cleanPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;

        const message = `Namaskar ${c.name} ji,\nLokmat newspaper bill for ${latestMonth}: ₹${c.current_balance?.toFixed(2)}.\nKindly clear the pending balance.\nPayment mode: Cash / UPI (${agency.upi_id || 'papertrack@upi'}).\nThank you,\n${agency.agency_name}`;
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        return {
          customer: c,
          phone: c.phone,
          cleanPhone,
          area: c.area,
          totalPendingDue: c.current_balance || 0,
          lastBillMonth: latestMonth,
          unpaidBillsCount: custBills.length,
          message,
          whatsappUrl,
        };
      });

    return dueCustomers.sort((a, b) => b.totalPendingDue - a.totalPendingDue);
  }

  // FEATURE 3: DAILY COLLECTION REPORT
  getDailyCollectionReport(filter?: { date?: string; startDate?: string; endDate?: string }) {
    const targetDate = filter?.date || (filter?.startDate ? undefined : new Date().toISOString().split('T')[0]);

    let payments = [...this.payments];

    if (targetDate) {
      payments = payments.filter((p) => p.payment_date === targetDate);
    } else if (filter?.startDate && filter?.endDate) {
      payments = payments.filter((p) => p.payment_date >= filter.startDate! && p.payment_date <= filter.endDate!);
    }

    payments.sort((a, b) => b.payment_date.localeCompare(a.payment_date));

    const validPayments = payments.filter((p) => !p.is_reversed);
    const reversedPayments = payments.filter((p) => p.is_reversed);

    const totalCollected = validPayments.reduce((sum, p) => sum + p.amount, 0);
    const cashCollected = validPayments.filter((p) => p.payment_mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const upiCollected = validPayments.filter((p) => p.payment_mode === 'UPI').reduce((sum, p) => sum + p.amount, 0);
    const reversedAmount = reversedPayments.reduce((sum, p) => sum + p.amount, 0);

    const transactions: CollectionTransaction[] = payments.map((p) => {
      const cust = this.customers.find((c) => c.id === p.customer_id);
      return {
        id: p.id,
        time: p.created_at ? p.created_at.split('T')[1]?.substring(0, 5) || '08:00' : '08:00',
        date: p.payment_date,
        customerId: p.customer_id,
        customerName: cust?.name || 'Customer',
        area: cust?.area || 'Area',
        amount: p.amount,
        mode: p.payment_mode,
        receiptNumber: p.receipt_number,
        recordedBy: p.recorded_by || 'Admin',
        status: p.is_reversed ? 'REVERSED' : 'COMPLETED',
        reversalReason: p.reversal_reason,
      };
    });

    return {
      date: targetDate || `${filter?.startDate} to ${filter?.endDate}`,
      totalCollected,
      cashCollected,
      upiCollected,
      paymentCount: validPayments.length,
      reversedCount: reversedPayments.length,
      reversedAmount,
      transactions,
    };
  }

  getCollectionSummaries() {
    const nonReversed = this.payments.filter((p) => !p.is_reversed);

    const monthMap: Record<string, { total: number; cash: number; upi: number; count: number }> = {};
    for (const p of nonReversed) {
      const month = p.payment_date.substring(0, 7);
      if (!monthMap[month]) {
        monthMap[month] = { total: 0, cash: 0, upi: 0, count: 0 };
      }
      monthMap[month].total += p.amount;
      if (p.payment_mode === 'CASH') monthMap[month].cash += p.amount;
      if (p.payment_mode === 'UPI') monthMap[month].upi += p.amount;
      monthMap[month].count += 1;
    }

    const monthly = Object.entries(monthMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return { monthly };
  }

  // FEATURE 4: CUSTOMER STATEMENT
  getCustomerStatement(customerId: string, startDate?: string, endDate?: string) {
    const customer = this.getCustomerById(customerId);
    if (!customer) throw new Error('Customer not found');

    const agency = this.getAgencySettings();

    const allCustomerBills = this.bills
      .filter((b) => b.customer_id === customerId)
      .sort((a, b) => a.billing_month.localeCompare(b.billing_month));

    const allCustomerPayments = this.payments
      .filter((p) => p.customer_id === customerId)
      .sort((a, b) => a.payment_date.localeCompare(b.payment_date));

    const rangeBills = allCustomerBills.filter((b) => {
      const d = `${b.billing_month}-01`;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    const rangePayments = allCustomerPayments.filter((p) => {
      if (startDate && p.payment_date < startDate) return false;
      if (endDate && p.payment_date > endDate) return false;
      return true;
    });

    let openingBalance = 0;
    if (startDate) {
      const priorBills = allCustomerBills.filter((b) => `${b.billing_month}-01` < startDate);
      const priorPayments = allCustomerPayments.filter((p) => !p.is_reversed && p.payment_date < startDate);
      const priorBilled = priorBills.reduce((sum, b) => sum + b.current_charges, 0);
      const priorPaid = priorPayments.reduce((sum, p) => sum + p.amount, 0);
      openingBalance = Math.max(0, priorBilled - priorPaid);
    }

    const rangeDeliveries = this.deliveryRecords.filter((d) => {
      if (d.customer_id !== customerId) return false;
      if (startDate && d.delivery_date < startDate) return false;
      if (endDate && d.delivery_date > endDate) return false;
      return true;
    });

    const deliveredCount = rangeDeliveries.filter((d) => d.status === 'DELIVERED').length;
    const notDeliveredCount = rangeDeliveries.filter((d) => d.status === 'NOT_DELIVERED').length;
    const pausedCount = rangeDeliveries.filter((d) => d.status === 'PAUSED').length;

    const totalBilledInRange = rangeBills.reduce((sum, b) => sum + b.current_charges, 0);
    const totalPaidInRange = rangePayments.filter((p) => !p.is_reversed).reduce((sum, p) => sum + p.amount, 0);
    const closingBalance = Math.max(0, openingBalance + totalBilledInRange - totalPaidInRange);

    return {
      customer,
      agency,
      startDate: startDate || 'Beginning',
      endDate: endDate || new Date().toISOString().split('T')[0],
      openingBalance,
      closingBalance,
      totalBilledInRange,
      totalPaidInRange,
      deliveredCount,
      notDeliveredCount,
      pausedCount,
      bills: rangeBills,
      payments: rangePayments,
      advanceBalance: customer.advance_balance || 0,
    };
  }

  // FEATURE 5: GLOBAL ADMIN SEARCH
  searchGlobal(query: string): GlobalSearchResult {
    if (!query || query.trim().length === 0) {
      return { customers: [], receipts: [] };
    }
    const q = query.trim().toLowerCase();

    const customers = this.getCustomers()
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        area: c.area,
        current_balance: c.current_balance || 0,
        status: c.status,
      }));

    const receipts = this.payments
      .filter((p) =>
        p.receipt_number.toLowerCase().includes(q) ||
        (p.upi_reference && p.upi_reference.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((p) => {
        const cust = this.customers.find((c) => c.id === p.customer_id);
        return {
          id: p.id,
          receiptNumber: p.receipt_number,
          customerName: cust?.name || 'Customer',
          amount: p.amount,
          mode: p.payment_mode,
          date: p.payment_date,
          isReversed: p.is_reversed,
        };
      });

    return { customers, receipts };
  }

  // FEATURE 6: SUBSCRIPTION PAUSES (VACATION HOLDS)
  getPauses(customerId?: string): SubscriptionPause[] {
    if (customerId) {
      return this.subscriptionPauses
        .filter((p) => p.customer_id === customerId)
        .sort((a, b) => b.start_date.localeCompare(a.start_date));
    }
    return [...this.subscriptionPauses].sort((a, b) => b.start_date.localeCompare(a.start_date));
  }

  createPause(params: {
    customerId: string;
    startDate: string;
    endDate: string;
    reason: string;
    createdBy?: string;
  }) {
    if (!params.startDate || !params.endDate) {
      throw new Error('Start date and End date are required');
    }
    if (params.startDate > params.endDate) {
      throw new Error('Start date cannot be after End date');
    }

    const pauseId = `pause-${Date.now()}`;
    const newPause: SubscriptionPause = {
      id: pauseId,
      customer_id: params.customerId,
      start_date: params.startDate,
      end_date: params.endDate,
      reason: params.reason || 'Vacation Hold',
      created_by: params.createdBy || 'Admin',
      created_at: new Date().toISOString(),
    };

    this.subscriptionPauses.push(newPause);

    // Automatically mark delivery records within this range as PAUSED
    const sub = this.subscriptions.find((s) => s.customer_id === params.customerId);
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      const existing = this.deliveryRecords.find(
        (r) => r.customer_id === params.customerId && r.delivery_date === dStr
      );
      if (existing) {
        existing.status = 'PAUSED';
        existing.notes = `Paused: ${params.reason}`;
      } else if (sub) {
        this.deliveryRecords.push({
          id: `del-pause-${params.customerId}-${dStr}`,
          customer_id: params.customerId,
          subscription_id: sub.id,
          delivery_date: dStr,
          status: 'PAUSED',
          marked_by: 'Admin',
          marked_at: new Date().toISOString(),
          notes: `Paused: ${params.reason}`,
        });
      }
    }

    const cust = this.getCustomerById(params.customerId);
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'SUBSCRIPTION_PAUSE',
      entity_id: pauseId,
      action: 'CREATE_PAUSE',
      performed_by: params.createdBy || 'Admin',
      details: {
        customerName: cust?.name,
        startDate: params.startDate,
        endDate: params.endDate,
        reason: params.reason,
      },
      created_at: new Date().toISOString(),
    });

    return newPause;
  }

  resumePauseEarly(pauseId: string) {
    const pause = this.subscriptionPauses.find((p) => p.id === pauseId);
    if (!pause) throw new Error('Pause record not found');

    const todayStr = new Date().toISOString().split('T')[0];
    pause.end_date = todayStr;

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'SUBSCRIPTION_PAUSE',
      entity_id: pauseId,
      action: 'RESUME_EARLY',
      performed_by: 'Admin',
      details: { pauseId, newEndDate: todayStr },
      created_at: new Date().toISOString(),
    });

    return pause;
  }

  // FEATURE 7: INTERNAL CUSTOMER NOTES (ADMIN ONLY)
  getCustomerNotes(customerId: string): CustomerNote[] {
    return this.customerNotes
      .filter((n) => n.customer_id === customerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  createCustomerNote(customerId: string, note: string, createdBy = 'Admin') {
    if (!note || note.trim().length === 0) {
      throw new Error('Note text cannot be empty');
    }

    const noteId = `note-${Date.now()}`;
    const newNote: CustomerNote = {
      id: noteId,
      customer_id: customerId,
      note: note.trim(),
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.customerNotes.push(newNote);

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'CUSTOMER_NOTE',
      entity_id: noteId,
      action: 'CREATE_NOTE',
      performed_by: createdBy,
      details: { customerId, noteLength: note.length },
      created_at: new Date().toISOString(),
    });

    return newNote;
  }

  updateCustomerNote(noteId: string, note: string) {
    const item = this.customerNotes.find((n) => n.id === noteId);
    if (!item) throw new Error('Note not found');

    item.note = note.trim();
    item.updated_at = new Date().toISOString();

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'CUSTOMER_NOTE',
      entity_id: noteId,
      action: 'UPDATE_NOTE',
      performed_by: 'Admin',
      details: { noteId },
      created_at: new Date().toISOString(),
    });

    return item;
  }

  deleteCustomerNote(noteId: string) {
    const idx = this.customerNotes.findIndex((n) => n.id === noteId);
    if (idx === -1) throw new Error('Note not found');

    const deleted = this.customerNotes.splice(idx, 1)[0];

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'CUSTOMER_NOTE',
      entity_id: noteId,
      action: 'DELETE_NOTE',
      performed_by: 'Admin',
      details: { noteId },
      created_at: new Date().toISOString(),
    });

    return deleted;
  }

  // FEATURE 9: AUDIT TIMELINE
  getAuditLogs(actionType?: string, startDate?: string, endDate?: string) {
    let logs = [...this.auditLogs];
    if (actionType && actionType !== 'ALL') {
      logs = logs.filter((l) => l.action.includes(actionType) || l.entity_type === actionType);
    }
    if (startDate) {
      logs = logs.filter((l) => l.created_at.split('T')[0] >= startDate);
    }
    if (endDate) {
      logs = logs.filter((l) => l.created_at.split('T')[0] <= endDate);
    }
    return logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  // FEATURE 10: ADMIN DASHBOARD ALERTS
  getAdminAlerts(): AdminAlert[] {
    const alerts: AdminAlert[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. High Outstanding Balances (> ₹300)
    const customers = this.getCustomers();
    const highDues = customers.filter((c) => (c.current_balance || 0) >= 300);
    if (highDues.length > 0) {
      alerts.push({
        id: 'alert-high-dues',
        type: 'WARNING',
        title: 'High Outstanding Balances',
        description: `${highDues.length} customers have pending dues of ₹300 or higher.`,
        count: highDues.length,
        actionLabel: 'Send WhatsApp Reminders',
        actionHref: '/admin/reminders',
      });
    }

    // 2. Unmarked Deliveries for Today
    const activeCustomers = customers.filter((c) => c.status === 'ACTIVE');
    const todayMarked = this.deliveryRecords.filter((r) => r.delivery_date === todayStr);
    const unmarkedCount = Math.max(0, activeCustomers.length - todayMarked.length);
    if (unmarkedCount > 0) {
      alerts.push({
        id: 'alert-unmarked-deliveries',
        type: 'CRITICAL',
        title: "Today's Deliveries Pending",
        description: `${unmarkedCount} customer deliveries have not been marked for today (${todayStr}).`,
        count: unmarkedCount,
        actionLabel: 'Mark Today Deliveries',
        actionHref: '/admin/delivery',
      });
    }

    // 3. Customers Missing Active Subscriptions
    const customersWithoutSub = activeCustomers.filter(
      (c) => !this.subscriptions.some((s) => s.customer_id === c.id && s.status === 'ACTIVE')
    );
    if (customersWithoutSub.length > 0) {
      alerts.push({
        id: 'alert-missing-subscriptions',
        type: 'INFO',
        title: 'Active Customers Missing Subscriptions',
        description: `${customersWithoutSub.length} active customers have no active newspaper subscription.`,
        count: customersWithoutSub.length,
        actionLabel: 'Manage Customers',
        actionHref: '/admin/customers',
      });
    }

    // 4. Ungenerated Bills for Previous Month (August 2026)
    const prevMonth = '2026-08';
    const customersWithoutAugBill = activeCustomers.filter(
      (c) => !this.bills.some((b) => b.customer_id === c.id && b.billing_month === prevMonth)
    );
    if (customersWithoutAugBill.length > 0) {
      alerts.push({
        id: 'alert-unbilled-month',
        type: 'WARNING',
        title: `Unbilled Customers for ${prevMonth}`,
        description: `${customersWithoutAugBill.length} customers have not been billed for ${prevMonth}.`,
        count: customersWithoutAugBill.length,
        actionLabel: 'Generate Monthly Bills',
        actionHref: '/admin/billing',
      });
    }

    return alerts;
  }
}

// Global Singleton for in-memory prototype
const globalStore = new DataStore();
export const dataService = globalStore;
