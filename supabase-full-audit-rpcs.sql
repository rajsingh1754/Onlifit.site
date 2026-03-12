-- ============================================================
-- Full Audit RPC Functions (SECURITY DEFINER)
-- Replace direct supabase.from() table calls with secure RPCs
-- ============================================================

-- 1. get_gym_attendance
CREATE OR REPLACE FUNCTION get_gym_attendance(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT * FROM attendance WHERE gym_id = p_gym_id ORDER BY created_at DESC
  ) t;
$$;

GRANT EXECUTE ON FUNCTION get_gym_attendance(text) TO authenticated;

-- 2. get_gym_staff
CREATE OR REPLACE FUNCTION get_gym_staff(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT * FROM staff WHERE gym_id = p_gym_id
  ) t;
$$;

GRANT EXECUTE ON FUNCTION get_gym_staff(text) TO authenticated;

-- 3. get_gym_trainers
CREATE OR REPLACE FUNCTION get_gym_trainers(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT * FROM trainers WHERE gym_id = p_gym_id
  ) t;
$$;

GRANT EXECUTE ON FUNCTION get_gym_trainers(text) TO authenticated;

-- 4. get_gym_plans
CREATE OR REPLACE FUNCTION get_gym_plans(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT * FROM plans WHERE gym_id = p_gym_id
  ) t;
$$;

GRANT EXECUTE ON FUNCTION get_gym_plans(text) TO authenticated;

-- 5. get_gym_payments
CREATE OR REPLACE FUNCTION get_gym_payments(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT * FROM payments WHERE gym_id = p_gym_id ORDER BY created_at DESC
  ) t;
$$;

GRANT EXECUTE ON FUNCTION get_gym_payments(text) TO authenticated;

-- 6. get_gym_profile
CREATE OR REPLACE FUNCTION get_gym_profile(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(g) FROM gym_profiles g WHERE g.gym_id = p_gym_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_gym_profile(text) TO authenticated;

-- 7. insert_payment
CREATE OR REPLACE FUNCTION insert_payment(
  p_gym_id text,
  p_member_id text,
  p_member_name text,
  p_invoice text,
  p_plan text,
  p_amount text,
  p_mode text,
  p_date text,
  p_status text,
  p_txn_id text DEFAULT ''
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO payments (gym_id, member_id, member_name, invoice, plan, amount, mode, date, status, txn_id)
  VALUES (p_gym_id, p_member_id, p_member_name, p_invoice, p_plan, p_amount, p_mode, p_date, p_status, p_txn_id);
$$;

GRANT EXECUTE ON FUNCTION insert_payment(text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- 8. save_staff_member
CREATE OR REPLACE FUNCTION save_staff_member(
  p_id text,
  p_gym_id text,
  p_name text,
  p_initials text,
  p_role text,
  p_branch text,
  p_members_count int DEFAULT 0,
  p_present bool DEFAULT true,
  p_salary int,
  p_phone text DEFAULT '',
  p_email text DEFAULT '',
  p_joined text DEFAULT '',
  p_qr text DEFAULT '',
  p_shift text DEFAULT 'Full Day'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO staff (id, gym_id, name, initials, role, branch, members_count, present, salary, phone, email, joined, qr, shift)
  VALUES (p_id, p_gym_id, p_name, p_initials, p_role, p_branch, p_members_count, p_present, p_salary, p_phone, p_email, p_joined, p_qr, p_shift)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    initials = EXCLUDED.initials,
    role = EXCLUDED.role,
    branch = EXCLUDED.branch,
    members_count = EXCLUDED.members_count,
    present = EXCLUDED.present,
    salary = EXCLUDED.salary,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    joined = EXCLUDED.joined,
    qr = EXCLUDED.qr,
    shift = EXCLUDED.shift;
$$;

GRANT EXECUTE ON FUNCTION save_staff_member(text, text, text, text, text, text, int, bool, int, text, text, text, text, text) TO authenticated;

-- 9. update_staff_member
CREATE OR REPLACE FUNCTION update_staff_member(
  p_id text,
  p_name text,
  p_role text,
  p_branch text,
  p_salary int,
  p_phone text DEFAULT '',
  p_email text DEFAULT '',
  p_joined text DEFAULT '',
  p_shift text DEFAULT 'Full Day'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE staff SET
    name = p_name,
    role = p_role,
    branch = p_branch,
    salary = p_salary,
    phone = p_phone,
    email = p_email,
    joined = p_joined,
    shift = p_shift
  WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION update_staff_member(text, text, text, text, int, text, text, text, text) TO authenticated;

-- 10. delete_staff_member
CREATE OR REPLACE FUNCTION delete_staff_member(p_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM staff WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION delete_staff_member(text) TO authenticated;

-- 11. update_staff_present
CREATE OR REPLACE FUNCTION update_staff_present(p_id text, p_present bool)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE staff SET present = p_present WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION update_staff_present(text, bool) TO authenticated;

-- 12. get_staff_attendance
CREATE OR REPLACE FUNCTION get_staff_attendance(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT * FROM staff_attendance WHERE gym_id = p_gym_id ORDER BY created_at DESC
  ) t;
$$;

GRANT EXECUTE ON FUNCTION get_staff_attendance(text) TO authenticated;

-- 13. get_staff_salary
CREATE OR REPLACE FUNCTION get_staff_salary(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT * FROM staff_salary WHERE gym_id = p_gym_id ORDER BY created_at DESC
  ) t;
$$;

GRANT EXECUTE ON FUNCTION get_staff_salary(text) TO authenticated;

-- 14. upsert_staff_attendance
CREATE OR REPLACE FUNCTION upsert_staff_attendance(
  p_id text DEFAULT NULL,
  p_gym_id text DEFAULT NULL,
  p_staff_id text DEFAULT NULL,
  p_staff_name text DEFAULT NULL,
  p_date text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_check_in text DEFAULT '',
  p_shift text DEFAULT 'Full Day'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_id text;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE staff_attendance SET status = p_status WHERE id = p_id
    RETURNING row_to_json(staff_attendance.*) INTO v_result;
  ELSE
    v_id := 'satt-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 6);
    INSERT INTO staff_attendance (id, gym_id, staff_id, staff_name, date, status, check_in, shift)
    VALUES (v_id, p_gym_id, p_staff_id, p_staff_name, p_date, p_status, p_check_in, p_shift)
    RETURNING row_to_json(staff_attendance.*) INTO v_result;
  END IF;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_staff_attendance(text, text, text, text, text, text, text, text) TO authenticated;

-- 15. upsert_staff_salary
CREATE OR REPLACE FUNCTION upsert_staff_salary(
  p_id text DEFAULT NULL,
  p_gym_id text DEFAULT NULL,
  p_staff_id text DEFAULT NULL,
  p_staff_name text DEFAULT NULL,
  p_month text DEFAULT NULL,
  p_amount int DEFAULT NULL,
  p_status text DEFAULT 'Paid',
  p_paid_date text DEFAULT '',
  p_mode text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE staff_salary SET status = p_status, paid_date = p_paid_date, mode = p_mode WHERE id = p_id
    RETURNING row_to_json(staff_salary.*) INTO v_result;
  ELSE
    INSERT INTO staff_salary (gym_id, staff_id, staff_name, month, amount, status, paid_date, mode)
    VALUES (p_gym_id, p_staff_id, p_staff_name, p_month, p_amount, p_status, p_paid_date, p_mode)
    RETURNING row_to_json(staff_salary.*) INTO v_result;
  END IF;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_staff_salary(text, text, text, text, text, int, text, text, text) TO authenticated;

-- 16. insert_attendance
CREATE OR REPLACE FUNCTION insert_attendance(
  p_id text,
  p_gym_id text,
  p_member_id text,
  p_member_name text,
  p_initials text,
  p_check_in text,
  p_date text,
  p_trainer text DEFAULT '',
  p_method text DEFAULT 'QR',
  p_status text DEFAULT 'inside'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO attendance (id, gym_id, member_id, member_name, initials, check_in, date, trainer, method, status)
  VALUES (p_id, p_gym_id, p_member_id, p_member_name, p_initials, p_check_in, p_date, p_trainer, p_method, p_status);
$$;

GRANT EXECUTE ON FUNCTION insert_attendance(text, text, text, text, text, text, text, text, text, text) TO authenticated;

-- 17. update_attendance_status
CREATE OR REPLACE FUNCTION update_attendance_status(p_id text, p_status text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE attendance SET status = p_status WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION update_attendance_status(text, text) TO authenticated;

-- 18. update_member_visits
CREATE OR REPLACE FUNCTION update_member_visits(p_id text, p_visits int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE members SET visits = p_visits WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION update_member_visits(text, int) TO authenticated;
