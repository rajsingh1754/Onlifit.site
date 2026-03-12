-- ============================================================================
-- Phase 6: Member Self-Service Portal — Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Add member_id to payments table (needed for member payment history queries)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS member_id TEXT DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS txn_id TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);

-- 2. Add freeze tracking to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS freeze_start TEXT DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS emergency_contact TEXT DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS emergency_phone TEXT DEFAULT '';

-- ============================================================================
-- 3. SECURITY DEFINER RPCs for Member Portal (bypass RLS)
-- ============================================================================

-- Get member attendance (last 30 records)
CREATE OR REPLACE FUNCTION get_member_attendance(p_member_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT json_agg(r) FROM (
      SELECT * FROM attendance WHERE member_id = p_member_id ORDER BY created_at DESC LIMIT 30
    ) r),
    '[]'::json
  );
$$;

-- Get plan price by gym_id and plan name
CREATE OR REPLACE FUNCTION get_plan_price(p_gym_id text, p_plan_name text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT row_to_json(p) FROM plans p WHERE p.gym_id = p_gym_id AND p.name = p_plan_name LIMIT 1;
$$;

-- Get single member by ID (for refresh)
CREATE OR REPLACE FUNCTION get_member_by_id(p_member_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT row_to_json(m) FROM members m WHERE m.id = p_member_id LIMIT 1;
$$;

-- Get member payment history (last 50 records)
CREATE OR REPLACE FUNCTION get_member_payments(p_member_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT json_agg(r) FROM (
      SELECT * FROM payments WHERE member_id = p_member_id ORDER BY created_at DESC LIMIT 50
    ) r),
    '[]'::json
  );
$$;

-- Insert a payment record
CREATE OR REPLACE FUNCTION insert_member_payment(
  p_gym_id text, p_member_id text, p_member_name text, p_invoice text,
  p_plan text, p_amount text, p_mode text, p_date text, p_status text, p_txn_id text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO payments (gym_id, member_id, member_name, invoice, plan, amount, mode, date, status, txn_id)
  VALUES (p_gym_id, p_member_id, p_member_name, p_invoice, p_plan, p_amount, p_mode, p_date, p_status, p_txn_id);
$$;

-- Update member fields from portal (freeze, unfreeze, profile, renewal)
CREATE OR REPLACE FUNCTION update_member_portal(
  p_id text,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_plan text DEFAULT NULL,
  p_expiry_date text DEFAULT NULL,
  p_freeze_start text DEFAULT NULL,
  p_emergency_contact text DEFAULT NULL,
  p_emergency_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE members SET
    phone = COALESCE(p_phone, phone),
    email = COALESCE(p_email, email),
    status = COALESCE(p_status, status),
    plan = COALESCE(p_plan, plan),
    expiry_date = COALESCE(p_expiry_date, expiry_date),
    freeze_start = COALESCE(p_freeze_start, freeze_start),
    emergency_contact = COALESCE(p_emergency_contact, emergency_contact),
    emergency_phone = COALESCE(p_emergency_phone, emergency_phone)
  WHERE id = p_id;
END;
$$;

-- Done! You can now use the Member Self-Service features.
