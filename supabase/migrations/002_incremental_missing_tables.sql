-- ============================================================================
-- PAPERTRACK: Incremental Migration for Missing Tables
-- Safe, idempotent script that does NOT recreate or alter existing tables
-- ============================================================================

-- 1. AGENCY SETTINGS TABLE (Singleton)
CREATE TABLE IF NOT EXISTS agency_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    agency_name TEXT NOT NULL DEFAULT 'PaperTrack - Lokmat Agency',
    agency_phone TEXT NOT NULL DEFAULT '+91 9822000001',
    agency_address TEXT NOT NULL DEFAULT 'Main Road, Market Yard, Maharashtra',
    default_daily_rate NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
    receipt_prefix TEXT NOT NULL DEFAULT 'REC-',
    upi_id TEXT DEFAULT 'papertrack@upi',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. IMPORT BATCHES TABLE (For diary CSV imports)
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    imported_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (Created safely only if not already existing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'agency_settings' AND policyname = 'Read agency settings'
    ) THEN
        CREATE POLICY "Read agency settings" ON agency_settings FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'agency_settings' AND policyname = 'Admin update agency settings'
    ) THEN
        CREATE POLICY "Admin update agency settings" ON agency_settings FOR ALL TO authenticated 
        USING (get_user_role(auth.uid()) = 'ADMIN');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'import_batches' AND policyname = 'Admin full import_batches'
    ) THEN
        CREATE POLICY "Admin full import_batches" ON import_batches FOR ALL TO authenticated 
        USING (get_user_role(auth.uid()) = 'ADMIN');
    END IF;
END $$;

-- 5. INSERT DEFAULT SETTINGS ROW SAFELY
INSERT INTO agency_settings (id, agency_name, agency_phone, agency_address, default_daily_rate, receipt_prefix, upi_id)
VALUES (1, 'PaperTrack - Lokmat Agency', '+91 9822000001', 'Main Road, Market Yard, Maharashtra', 5.00, 'REC-', 'papertrack@upi')
ON CONFLICT (id) DO NOTHING;

-- 6. ENSURE DEFAULT LOKMAT NEWSPAPER EXISTS
INSERT INTO newspapers (id, name, language, default_daily_rate, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'Lokmat', 'Marathi', 5.00, true)
ON CONFLICT (id) DO NOTHING;
