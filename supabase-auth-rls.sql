-- ============================================================================
-- ONLIFIT — Phase 1: Auth Migration + Row Level Security
-- Run this in Supabase SQL Editor AFTER the initial schema has been created
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Supabase Auth users for existing gym accounts
-- (This creates real auth users that can sign in with email/password)
-- ============================================================================

-- You need to create auth users via Supabase Dashboard:
--   Go to Authentication → Users → Add User (for each gym account)
--   Email: raj@onlifit.com       Password: Onlifit@2025
--   Email: suresh@pzone.com      Password: PowerZ@001
--   Email: demo@newgym.com       Password: NewGym@001
--
-- OR use the Supabase Auth Admin API / Management Console to bulk-create them.

-- ============================================================================
-- STEP 2: Remove password column from gym_accounts (no longer needed)
-- Auth is now handled by Supabase Auth, not custom password matching
-- ============================================================================

ALTER TABLE gym_accounts DROP COLUMN IF EXISTS password;

-- ============================================================================
-- STEP 3: Enable Row Level Security on ALL tables
-- ============================================================================

ALTER TABLE gym_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: RLS Policies — each gym owner can only access their own data
-- ============================================================================

-- Helper: get current user's gym_id from their auth email
CREATE OR REPLACE FUNCTION public.get_my_gym_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT gym_id FROM public.gym_accounts
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1;
$$;

-- ── GYM ACCOUNTS ──────────────────────────────────────────────────────────────
-- Users can only read their own gym account
CREATE POLICY "Users can view own gym account"
  ON gym_accounts FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own gym account"
  ON gym_accounts FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ── GYM PROFILES ──────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gym profile"
  ON gym_profiles FOR SELECT
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can insert own gym profile"
  ON gym_profiles FOR INSERT
  WITH CHECK (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can update own gym profile"
  ON gym_profiles FOR UPDATE
  USING (gym_id = public.get_my_gym_id());

-- ── MEMBERS ───────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gym members"
  ON members FOR SELECT
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can insert own gym members"
  ON members FOR INSERT
  WITH CHECK (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can update own gym members"
  ON members FOR UPDATE
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can delete own gym members"
  ON members FOR DELETE
  USING (gym_id = public.get_my_gym_id());

-- ── STAFF ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gym staff"
  ON staff FOR SELECT
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can insert own gym staff"
  ON staff FOR INSERT
  WITH CHECK (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can update own gym staff"
  ON staff FOR UPDATE
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can delete own gym staff"
  ON staff FOR DELETE
  USING (gym_id = public.get_my_gym_id());

-- ── TRAINERS ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gym trainers"
  ON trainers FOR SELECT
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can insert own gym trainers"
  ON trainers FOR INSERT
  WITH CHECK (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can update own gym trainers"
  ON trainers FOR UPDATE
  USING (gym_id = public.get_my_gym_id());

-- ── ATTENDANCE ────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gym attendance"
  ON attendance FOR SELECT
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can insert own gym attendance"
  ON attendance FOR INSERT
  WITH CHECK (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can update own gym attendance"
  ON attendance FOR UPDATE
  USING (gym_id = public.get_my_gym_id());

-- ── PLANS ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gym plans"
  ON plans FOR SELECT
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can insert own gym plans"
  ON plans FOR INSERT
  WITH CHECK (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can update own gym plans"
  ON plans FOR UPDATE
  USING (gym_id = public.get_my_gym_id());

-- ── PAYMENTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own gym payments"
  ON payments FOR SELECT
  USING (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can insert own gym payments"
  ON payments FOR INSERT
  WITH CHECK (gym_id = public.get_my_gym_id());

CREATE POLICY "Users can update own gym payments"
  ON payments FOR UPDATE
  USING (gym_id = public.get_my_gym_id());
