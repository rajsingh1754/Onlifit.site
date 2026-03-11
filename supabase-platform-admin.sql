-- ============================================================================
-- ONLIFIT — Platform Admin Setup
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ── PLATFORM ADMINS TABLE ─────────────────────────────────────────────────────
-- Stores emails of users who can access the Owner/Command panel
CREATE TABLE IF NOT EXISTS platform_admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert your admin account
INSERT INTO platform_admins (email, name)
VALUES ('saranshandotra07@gmail.com', 'Saransh Andotra')
ON CONFLICT (email) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Platform admins can read the admins table (to verify their own access)
DROP POLICY IF EXISTS "Admins can view platform_admins" ON platform_admins;
CREATE POLICY "Admins can view platform_admins"
  ON platform_admins FOR SELECT
  USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

-- ── PLATFORM ADMIN ACCESS TO ALL GYM DATA ────────────────────────────────────
-- These policies let platform admins see ALL rows in gym_accounts
-- (Regular gym owners already have their own per-gym policies)

DROP POLICY IF EXISTS "Platform admin full access gym_accounts SELECT" ON gym_accounts;
CREATE POLICY "Platform admin full access gym_accounts SELECT"
  ON gym_accounts FOR SELECT
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM platform_admins)
  );

DROP POLICY IF EXISTS "Platform admin full access gym_accounts INSERT" ON gym_accounts;
CREATE POLICY "Platform admin full access gym_accounts INSERT"
  ON gym_accounts FOR INSERT
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM platform_admins)
  );

DROP POLICY IF EXISTS "Platform admin full access gym_accounts UPDATE" ON gym_accounts;
CREATE POLICY "Platform admin full access gym_accounts UPDATE"
  ON gym_accounts FOR UPDATE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM platform_admins)
  );

DROP POLICY IF EXISTS "Platform admin full access gym_accounts DELETE" ON gym_accounts;
CREATE POLICY "Platform admin full access gym_accounts DELETE"
  ON gym_accounts FOR DELETE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM platform_admins)
  );

-- Platform admin access to members (for member count enrichment)
DROP POLICY IF EXISTS "Platform admin view all members" ON members;
CREATE POLICY "Platform admin view all members"
  ON members FOR SELECT
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (SELECT email FROM platform_admins)
  );
