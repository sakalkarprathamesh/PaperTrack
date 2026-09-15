-- ============================================================================
-- PAPERTRACK: Customer & Delivery Boy 4-Digit PIN Authentication
-- Safe incremental migration: Adds PIN hash, unique Login ID, and lockout fields.
-- Does NOT drop tables, reset schemas, or delete any user or financial records.
-- ============================================================================

-- 1. ADD PIN AUTHENTICATION FIELDS TO CUSTOMERS TABLE
ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ;

-- Constraint: Customer login_id must consist of digits only (when set)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'customers_login_id_digits_check'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_login_id_digits_check 
        CHECK (login_id IS NULL OR login_id ~ '^[0-9]+$');
    END IF;
END $$;

-- Unique index on non-null customer login_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_login_id ON customers(login_id) WHERE login_id IS NOT NULL;


-- 2. ADD PIN AUTHENTICATION FIELDS TO DELIVERY BOYS TABLE
ALTER TABLE delivery_boys ADD COLUMN IF NOT EXISTS login_id TEXT;
ALTER TABLE delivery_boys ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE delivery_boys ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE delivery_boys ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE delivery_boys ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE delivery_boys ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ;

-- Constraint: Delivery Boy login_id must be 'D' followed by exactly 3 digits (e.g. D001)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'delivery_boys_login_id_format_check'
    ) THEN
        ALTER TABLE delivery_boys ADD CONSTRAINT delivery_boys_login_id_format_check 
        CHECK (login_id IS NULL OR login_id ~ '^D[0-9]{3}$');
    END IF;
END $$;

-- Unique index on non-null delivery boy login_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_boys_login_id ON delivery_boys(login_id) WHERE login_id IS NOT NULL;


-- 3. SAFE BACKFILL FOR EXISTING RECORDS (DOES NOT OVERWRITE ALREADY ASSIGNED IDs)
-- Backfill existing delivery boys with standard D001, D002 IDs
UPDATE delivery_boys 
SET login_id = 'D001', pin_updated_at = now() 
WHERE phone = '+91 9822000002' AND login_id IS NULL;

UPDATE delivery_boys 
SET login_id = 'D002', pin_updated_at = now() 
WHERE phone = '+91 9822000003' AND login_id IS NULL;

-- Backfill existing customers using their cleaned numeric phone digits where missing
UPDATE customers 
SET login_id = regexp_replace(phone, '[^0-9]', '', 'g'), pin_updated_at = now()
WHERE login_id IS NULL AND phone IS NOT NULL AND regexp_replace(phone, '[^0-9]', '', 'g') <> '';

-- 4. CONFIRM PERMISSIONS
-- Ensure delivery boys cannot access financial records (bills, bill_items, payments, allocations)
-- Row Level Security policies already established in 001_initial_schema.sql remain strictly enforced.
