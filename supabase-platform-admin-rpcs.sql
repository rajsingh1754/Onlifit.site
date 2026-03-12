-- ═══════════════════════════════════════════════════════════════════════════
-- PLATFORM ADMIN RPCs  (Owner Panel)
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Get all gym accounts with member counts (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_gym_accounts()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT g.*,
           (SELECT count(*) FROM members m WHERE m.gym_id = g.gym_id) AS member_count
    FROM gym_accounts g
    ORDER BY g.created_at DESC
  ) t;
$$;

-- 2. Delete a gym account (bypasses RLS)
CREATE OR REPLACE FUNCTION delete_gym_account(p_gym_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM gym_accounts WHERE gym_id = p_gym_id;
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION get_all_gym_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_gym_account(text) TO authenticated;
