-- ============================================================================
-- ONLIFIT — Staff Management Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Add shift column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'Full Day';

-- 2. Staff Attendance table (daily check-in/check-out for staff)
CREATE TABLE IF NOT EXISTS staff_attendance (
  id          SERIAL PRIMARY KEY,
  gym_id      TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  staff_id    TEXT NOT NULL REFERENCES staff(id),
  staff_name  TEXT DEFAULT '',
  date        TEXT NOT NULL,
  status      TEXT DEFAULT 'Present',   -- Present, Absent, Half Day, Leave
  check_in    TEXT DEFAULT '',
  check_out   TEXT DEFAULT '',
  shift       TEXT DEFAULT 'Full Day',
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Salary payment history
CREATE TABLE IF NOT EXISTS staff_salary (
  id          SERIAL PRIMARY KEY,
  gym_id      TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  staff_id    TEXT NOT NULL REFERENCES staff(id),
  staff_name  TEXT DEFAULT '',
  month       TEXT NOT NULL,             -- e.g. '2026-03'
  amount      INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'Pending',    -- Paid, Pending, Partial
  paid_date   TEXT DEFAULT '',
  mode        TEXT DEFAULT '',           -- Cash, UPI, Bank Transfer
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_att_gym    ON staff_attendance(gym_id);
CREATE INDEX IF NOT EXISTS idx_staff_att_date   ON staff_attendance(gym_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_att_staff  ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sal_gym    ON staff_salary(gym_id);
CREATE INDEX IF NOT EXISTS idx_staff_sal_month  ON staff_salary(gym_id, month);
