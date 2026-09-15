-- ============================================================================
-- PAPERTRACK: Phase 5 Incremental Migration
-- Safe, idempotent script that does NOT drop, reset, or alter existing tables
-- ============================================================================

-- 1. INTERNAL CUSTOMER NOTES TABLE (Admin-only private notes)
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SUBSCRIPTION PAUSES TABLE (Vacation holds)
CREATE TABLE IF NOT EXISTS subscription_pauses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL DEFAULT 'Vacation',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_pauses_customer_id ON subscription_pauses(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_pauses_dates ON subscription_pauses(start_date, end_date);

-- 4. ENABLE RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_pauses ENABLE ROW LEVEL SECURITY;

-- 5. DEFENSIVE POLICIES (Admin-only access)
DO $$
BEGIN
    -- Customer Notes: Admin full access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'customer_notes' AND policyname = 'Admin full customer_notes'
    ) THEN
        CREATE POLICY "Admin full customer_notes" ON customer_notes FOR ALL TO authenticated
        USING (get_user_role(auth.uid()) = 'ADMIN');
    END IF;

    -- Subscription Pauses: Admin full access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscription_pauses' AND policyname = 'Admin full subscription_pauses'
    ) THEN
        CREATE POLICY "Admin full subscription_pauses" ON subscription_pauses FOR ALL TO authenticated
        USING (get_user_role(auth.uid()) = 'ADMIN');
    END IF;

    -- Subscription Pauses: Delivery staff read-only access (to know paused route dates)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscription_pauses' AND policyname = 'Delivery staff view subscription_pauses'
    ) THEN
        CREATE POLICY "Delivery staff view subscription_pauses" ON subscription_pauses FOR SELECT TO authenticated
        USING (get_user_role(auth.uid()) = 'DELIVERY_BOY');
    END IF;
END $$;
