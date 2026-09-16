-- ============================================================================
-- PAPERTRACK: Safe Incremental Migration 007
-- Admin Role & Security Hardening
-- Ensures case-insensitive role resolution and optimizes login indexes
-- ============================================================================

-- 1. Ensure get_user_role function handles casing consistently
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS text AS $$
    SELECT UPPER(role::text) FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Performance indexes for mobile number lookup and status
CREATE INDEX IF NOT EXISTS idx_customers_login_enabled ON customers(login_enabled);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_login_enabled ON delivery_boys(login_enabled);
