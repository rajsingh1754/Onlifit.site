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

-- Done! You can now use the Member Self-Service features.
