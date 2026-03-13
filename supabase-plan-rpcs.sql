-- ============================================================================
-- ONLIFIT — Plan Management RPCs
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Upsert (create or update) a gym plan
CREATE OR REPLACE FUNCTION upsert_gym_plan(
  p_gym_id text, p_name text, p_days integer, p_price integer, p_pt text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO plans (gym_id, name, days, price, pt)
  VALUES (p_gym_id, p_name, p_days, p_price, p_pt)
  ON CONFLICT (gym_id, name)
  DO UPDATE SET days = EXCLUDED.days, price = EXCLUDED.price, pt = EXCLUDED.pt;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_gym_plan(text, text, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_gym_plan(text, text, integer, integer, text) TO anon;

-- 2. Delete a gym plan by name
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
-- You need a unique constraint on plans(gym_id, name). Run this first:
-- ALTER TABLE plans ADD CONSTRAINT plans_gym_name_unique UNIQUE (gym_id, name);
