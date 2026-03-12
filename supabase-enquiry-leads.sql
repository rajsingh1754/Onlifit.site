-- filepath: /Users/saransh/onlifit/supabase-enquiry-leads.sql
-- ============================================================================
-- ONLIFIT — Phase 9: Enquiry & Lead Management Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- Enquiries / Leads table
CREATE TABLE IF NOT EXISTS enquiries (
  id              TEXT PRIMARY KEY,
  gym_id          TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  name            TEXT NOT NULL,
  phone           TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  source          TEXT DEFAULT 'Walk-in',   -- Walk-in, Phone, Instagram, Google, Referral, Website
  interest        TEXT DEFAULT 'Monthly',   -- plan they're interested in
  status          TEXT DEFAULT 'New',       -- New, Contacted, Follow-up, Trial, Converted, Lost
  assigned_to     TEXT DEFAULT '',          -- trainer/staff name
  notes           TEXT DEFAULT '',
  follow_up_date  TEXT DEFAULT '',          -- YYYY-MM-DD
  trial_date      TEXT DEFAULT '',          -- YYYY-MM-DD
  converted_member_id TEXT DEFAULT '',      -- member id after conversion
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_gym ON enquiries(gym_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(gym_id, status);

-- Seed enquiries for GYM-001
INSERT INTO enquiries (id, gym_id, name, phone, email, source, interest, status, assigned_to, notes, follow_up_date, trial_date) VALUES
  ('ENQ-001', 'GYM-001', 'Amit Verma',    '+91 99887 76655', 'amit.v@gmail.com',    'Walk-in',   'Monthly',   'New',        'Vikram Singh', 'Visited gym, interested in morning batch', '', ''),
  ('ENQ-002', 'GYM-001', 'Neha Kapoor',   '+91 88776 65544', 'neha.k@gmail.com',    'Instagram', 'Quarterly', 'Contacted',  'Pooja Reddy',  'DM on Instagram, sent pricing',            '2026-03-13', ''),
  ('ENQ-003', 'GYM-001', 'Rahul Desai',   '+91 77665 54433', 'rahul.d@gmail.com',   'Google',    'Yearly',    'Follow-up',  'Aryan Nair',   'Found us on Google Maps, wants PT',        '2026-03-10', ''),
  ('ENQ-004', 'GYM-001', 'Simran Kaur',   '+91 66554 43322', 'simran.k@gmail.com',  'Referral',  'Monthly',   'Trial',      'Vikram Singh', 'Referred by Arjun Mehta',                  '', '2026-03-12'),
  ('ENQ-005', 'GYM-001', 'Varun Reddy',   '+91 55443 32211', 'varun.r@gmail.com',   'Phone',     'Quarterly', 'Converted',  'Pooja Reddy',  'Joined as member',                         '', ''),
  ('ENQ-006', 'GYM-001', 'Megha Shah',    '+91 44332 21100', 'megha.s@gmail.com',   'Website',   'Monthly',   'Lost',       'Aryan Nair',   'Too expensive, joined competitor',          '', '');

-- ============================================================================
-- SECURITY DEFINER RPCs for Enquiries (bypass RLS)
-- ============================================================================

-- Get all enquiries for a gym
CREATE OR REPLACE FUNCTION get_gym_enquiries(p_gym_id text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT json_agg(r) FROM (
      SELECT * FROM enquiries WHERE gym_id = p_gym_id ORDER BY created_at DESC
    ) r),
    '[]'::json
  );
$$;

-- Upsert (save or update) an enquiry
CREATE OR REPLACE FUNCTION save_enquiry(
  p_id text, p_gym_id text, p_name text, p_phone text, p_email text,
  p_source text, p_interest text, p_status text, p_assigned_to text,
  p_notes text, p_follow_up_date text, p_trial_date text, p_converted_member_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO enquiries (id, gym_id, name, phone, email, source, interest, status, assigned_to, notes, follow_up_date, trial_date, converted_member_id, updated_at)
  VALUES (p_id, p_gym_id, p_name, p_phone, p_email, p_source, p_interest, p_status, p_assigned_to, p_notes, p_follow_up_date, p_trial_date, p_converted_member_id, now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
    source = EXCLUDED.source, interest = EXCLUDED.interest, status = EXCLUDED.status,
    assigned_to = EXCLUDED.assigned_to, notes = EXCLUDED.notes,
    follow_up_date = EXCLUDED.follow_up_date, trial_date = EXCLUDED.trial_date,
    converted_member_id = EXCLUDED.converted_member_id, updated_at = now();
END;
$$;

-- Delete an enquiry
CREATE OR REPLACE FUNCTION delete_enquiry(p_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM enquiries WHERE id = p_id;
$$;
