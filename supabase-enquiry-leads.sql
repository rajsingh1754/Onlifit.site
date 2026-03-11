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
