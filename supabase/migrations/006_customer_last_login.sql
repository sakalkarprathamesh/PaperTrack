-- ============================================================================
-- PAPERTRACK: Customer & Delivery Boy Last Login Timestamp
-- Safe incremental migration: Adds last_login_at field.
-- Does NOT drop tables, reset schemas, or delete any user or financial records.
-- ============================================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE delivery_boys ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
