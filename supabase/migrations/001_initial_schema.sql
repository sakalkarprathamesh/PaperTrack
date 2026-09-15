-- ============================================================================
-- PAPERTRACK: Initial Database Schema Migration
-- Newspaper Distribution & Billing Management
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('ADMIN', 'DELIVERY_BOY', 'CUSTOMER');
CREATE TYPE customer_status AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE delivery_status AS ENUM ('DELIVERED', 'NOT_DELIVERED', 'PAUSED');
CREATE TYPE bill_status AS ENUM ('PENDING', 'PARTIAL', 'CLEARED');
CREATE TYPE payment_mode AS ENUM ('CASH', 'UPI');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- 2. PROFILES TABLE (linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. DELIVERY BOYS TABLE
CREATE TABLE delivery_boys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    area TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CUSTOMERS TABLE
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT NOT NULL,
    delivery_boy_id UUID REFERENCES delivery_boys(id) ON DELETE SET NULL,
    status customer_status NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    advance_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (advance_balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. NEWSPAPERS TABLE
CREATE TABLE newspapers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'Marathi',
    default_daily_rate NUMERIC(6, 2) NOT NULL DEFAULT 5.00 CHECK (default_daily_rate > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. SUBSCRIPTIONS TABLE
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    newspaper_id UUID NOT NULL REFERENCES newspapers(id) ON DELETE RESTRICT,
    daily_rate NUMERIC(6, 2) NOT NULL DEFAULT 5.00 CHECK (daily_rate > 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. DELIVERY RECORDS TABLE
CREATE TABLE delivery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    status delivery_status NOT NULL DEFAULT 'DELIVERED',
    marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    CONSTRAINT unique_customer_sub_date UNIQUE (customer_id, subscription_id, delivery_date)
);

-- 8. BILLS TABLE
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    billing_month TEXT NOT NULL, -- format 'YYYY-MM'
    previous_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    current_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_due NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status bill_status NOT NULL DEFAULT 'PENDING',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_customer_month UNIQUE (customer_id, billing_month)
);

-- 9. BILL ITEMS TABLE
CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    delivered_days INTEGER NOT NULL DEFAULT 0 CHECK (delivered_days >= 0),
    daily_rate NUMERIC(6, 2) NOT NULL CHECK (daily_rate > 0),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. PAYMENTS TABLE
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_mode payment_mode NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    upi_reference TEXT,
    receipt_number TEXT NOT NULL UNIQUE,
    notes TEXT,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_reversed BOOLEAN NOT NULL DEFAULT false,
    reversal_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. PAYMENT ALLOCATIONS TABLE
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(10, 2) NOT NULL CHECK (allocated_amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. AGENCY SETTINGS TABLE (Singleton)
CREATE TABLE agency_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    agency_name TEXT NOT NULL DEFAULT 'PaperTrack - Lokmat Agency',
    agency_phone TEXT NOT NULL DEFAULT '+91 9876543210',
    agency_address TEXT NOT NULL DEFAULT 'Main Road, Market Yard, Maharashtra',
    default_daily_rate NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
    receipt_prefix TEXT NOT NULL DEFAULT 'REC-',
    upi_id TEXT DEFAULT 'papertrack@upi',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. IMPORT BATCHES TABLE
CREATE TABLE import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    imported_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR HIGH QUERY PERFORMANCE
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_area ON customers(area);
CREATE INDEX idx_customers_delivery_boy ON customers(delivery_boy_id);
CREATE INDEX idx_customers_profile ON customers(profile_id);
CREATE INDEX idx_delivery_records_lookup ON delivery_records(customer_id, delivery_date);
CREATE INDEX idx_delivery_records_date ON delivery_records(delivery_date);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_month ON bills(billing_month);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);
CREATE INDEX idx_payment_allocations_bill ON payment_allocations(bill_id);
CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_boys_updated_at BEFORE UPDATE ON delivery_boys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_newspapers_updated_at BEFORE UPDATE ON newspapers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agency_settings_updated_at BEFORE UPDATE ON agency_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HELPER FUNCTION TO GET CURRENT USER'S ROLE
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES (Full Access)
CREATE POLICY "Admin full profiles" ON profiles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Users can read/update own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin full delivery_boys" ON delivery_boys FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Delivery boy view own record" ON delivery_boys FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY "Admin full customers" ON customers FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Delivery boy view assigned customers" ON customers FOR SELECT TO authenticated 
    USING (delivery_boy_id IN (SELECT id FROM delivery_boys WHERE profile_id = auth.uid()));
CREATE POLICY "Customer view own customer record" ON customers FOR SELECT TO authenticated USING (profile_id = auth.uid());

CREATE POLICY "Read newspapers" ON newspapers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage newspapers" ON newspapers FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Admin full subscriptions" ON subscriptions FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Customer view own subscriptions" ON subscriptions FOR SELECT TO authenticated 
    USING (customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()));

CREATE POLICY "Admin full delivery_records" ON delivery_records FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Delivery boy read assigned records" ON delivery_records FOR SELECT TO authenticated 
    USING (customer_id IN (SELECT id FROM customers WHERE delivery_boy_id IN (SELECT id FROM delivery_boys WHERE profile_id = auth.uid())));
CREATE POLICY "Delivery boy insert/update assigned records" ON delivery_records FOR INSERT TO authenticated 
    WITH CHECK (customer_id IN (SELECT id FROM customers WHERE delivery_boy_id IN (SELECT id FROM delivery_boys WHERE profile_id = auth.uid())));
CREATE POLICY "Delivery boy update assigned records" ON delivery_records FOR UPDATE TO authenticated 
    USING (customer_id IN (SELECT id FROM customers WHERE delivery_boy_id IN (SELECT id FROM delivery_boys WHERE profile_id = auth.uid())));
CREATE POLICY "Customer view own delivery records" ON delivery_records FOR SELECT TO authenticated 
    USING (customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()));

-- FINANCIAL TABLES (STRICTLY NO ACCESS FOR DELIVERY BOYS)
CREATE POLICY "Admin full bills" ON bills FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Customer view own bills" ON bills FOR SELECT TO authenticated 
    USING (customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()));

CREATE POLICY "Admin full bill_items" ON bill_items FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Customer view own bill_items" ON bill_items FOR SELECT TO authenticated 
    USING (bill_id IN (SELECT id FROM bills WHERE customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())));

CREATE POLICY "Admin full payments" ON payments FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Customer view own payments" ON payments FOR SELECT TO authenticated 
    USING (customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()));

CREATE POLICY "Admin full payment_allocations" ON payment_allocations FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Customer view own payment_allocations" ON payment_allocations FOR SELECT TO authenticated 
    USING (bill_id IN (SELECT id FROM bills WHERE customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())));

CREATE POLICY "Read agency settings" ON agency_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update agency settings" ON agency_settings FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Admin full audit_logs" ON audit_logs FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Admin full import_batches" ON import_batches FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'ADMIN');

-- INSERT DEFAULT SETTINGS ROW
INSERT INTO agency_settings (id, agency_name, agency_phone, agency_address, default_daily_rate, receipt_prefix, upi_id)
VALUES (1, 'PaperTrack - Lokmat Agency', '+91 9876543210', 'Main Road, Market Yard, Maharashtra', 5.00, 'REC-', 'papertrack@upi')
ON CONFLICT (id) DO NOTHING;

-- INSERT DEFAULT LOKMAT NEWSPAPER
INSERT INTO newspapers (id, name, language, default_daily_rate, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'Lokmat', 'Marathi', 5.00, true)
ON CONFLICT (id) DO NOTHING;
