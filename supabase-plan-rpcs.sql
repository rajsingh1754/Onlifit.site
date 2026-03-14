-- ============================================================================
-- ONLIFIT — Plan Management RPCs (v2 — with plan type support)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- Step 1: Add 'type' column to plans table (safe to re-run)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Membership';

-- Step 2: Upsert (create or update) a gym plan — now includes type
CREATE OR REPLACE FUNCTION upsert_gym_plan(
  p_gym_id text, p_name text, p_days integer, p_price integer, p_pt text, p_type text DEFAULT 'Membership'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO plans (gym_id, name, days, price, pt, type)
  VALUES (p_gym_id, p_name, p_days, p_price, p_pt, p_type)
  ON CONFLICT (gym_id, name)
  DO UPDATE SET days = EXCLUDED.days, price = EXCLUDED.price, pt = EXCLUDED.pt, type = EXCLUDED.type;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_gym_plan(text, text, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_gym_plan(text, text, integer, integer, text, text) TO anon;

-- Step 3: Delete a gym plan by name (unchanged)
CREATE OR REPLACE FUNCTION delete_gym_plan(p_gym_id text, p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM plans WHERE gym_id = p_gym_id AND name = p_name;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_gym_plan(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_gym_plan(text, text) TO anon;

-- NOTE: The upsert uses ON CONFLICT (gym_id, name).
-- If you haven't already, run:
-- ALTER TABLE plans ADD CONSTRAINT plans_gym_name_unique UNIQUE (gym_id, name);
