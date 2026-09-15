-- ============================================================================
-- PAPERTRACK: Safe Incremental Migration 005 - Customer 10-Digit Mobile Login Sync
-- Synchronizes customer login_id to the 10-digit mobile number.
-- Does NOT drop tables, reset schemas, or delete any customer or financial data.
-- ============================================================================

-- 1. Ensure login_id and pin_hash columns exist on customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ;

-- 2. Synchronize existing customer login_ids to 10-digit mobile numbers
-- For records with longer numeric login_ids (e.g. 919822111001), trim to last 10 digits
UPDATE customers 
SET login_id = RIGHT(regexp_replace(login_id, '[^0-9]', '', 'g'), 10),
    pin_updated_at = COALESCE(pin_updated_at, now())
WHERE login_id IS NOT NULL 
  AND length(regexp_replace(login_id, '[^0-9]', '', 'g')) > 10;

-- Backfill any missing customer login_id from the last 10 digits of their phone number
UPDATE customers 
SET login_id = RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10),
    pin_updated_at = COALESCE(pin_updated_at, now())
WHERE (login_id IS NULL OR login_id = '') 
  AND phone IS NOT NULL 
  AND length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10;

-- 3. Verify unique index on non-null customer login_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_login_id ON customers(login_id) WHERE login_id IS NOT NULL;
