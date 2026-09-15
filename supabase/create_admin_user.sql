-- ============================================================================
-- PAPERTRACK: Create or Update Admin User in Supabase Auth & Profiles
-- Run this in your Supabase SQL Editor if you need to create/reset the user directly.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_uid UUID;
BEGIN
    -- 1. Check if user already exists in auth.users
    SELECT id INTO admin_uid FROM auth.users WHERE email = 'sakalkarashok77@gmail.com';

    IF admin_uid IS NULL THEN
        -- Create new UUID
        admin_uid := 'a0000000-0000-0000-0000-000000000001';
        
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            admin_uid,
            '00000000-0000-0000-0000-000000000000',
            'sakalkarashok77@gmail.com',
            crypt('ashok77', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Admin (Agency Owner)"}',
            now(),
            now(),
            'authenticated',
            'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET 
            email = 'sakalkarashok77@gmail.com',
            encrypted_password = crypt('ashok77', gen_salt('bf')),
            email_confirmed_at = now();
    ELSE
        -- Update password and confirmation for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt('ashok77', gen_salt('bf')),
            email_confirmed_at = now()
        WHERE id = admin_uid;
    END IF;

    -- 2. Ensure Admin profile exists with ADMIN role
    INSERT INTO profiles (id, full_name, phone, role)
    VALUES (admin_uid, 'Admin (Agency Owner)', '+91 9822000001', 'ADMIN')
    ON CONFLICT (id) DO UPDATE SET 
        role = 'ADMIN',
        full_name = 'Admin (Agency Owner)';

    RAISE NOTICE 'Admin user sakalkarashok77@gmail.com successfully configured with ADMIN role.';
END $$;
