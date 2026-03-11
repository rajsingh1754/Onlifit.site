-- ============================================================================
-- ONLIFIT — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. GYM ACCOUNTS (login credentials for gym owners)
CREATE TABLE gym_accounts (
  gym_id      TEXT PRIMARY KEY,
  user_id     TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  name        TEXT NOT NULL,
  gym_name    TEXT NOT NULL,
  city        TEXT DEFAULT '',
  role        TEXT DEFAULT 'gym_owner',
  is_new      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. GYM PROFILES (onboarding data)
CREATE TABLE gym_profiles (
  gym_id      TEXT PRIMARY KEY REFERENCES gym_accounts(gym_id),
  gym_name    TEXT NOT NULL,
  tagline     TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  city        TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  gstin       TEXT DEFAULT '',
  open_time   TEXT DEFAULT '05:00',
  close_time  TEXT DEFAULT '23:00',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. MEMBERS
CREATE TABLE members (
  id          TEXT PRIMARY KEY,
  gym_id      TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  name        TEXT NOT NULL,
  initials    TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  dob         TEXT DEFAULT '',
  plan        TEXT DEFAULT 'Monthly',
  start_date  TEXT DEFAULT '',
  expiry_date TEXT DEFAULT '',
  status      TEXT DEFAULT 'Active',
  trainer     TEXT DEFAULT '',
  visits      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. STAFF
CREATE TABLE staff (
  id          TEXT PRIMARY KEY,
  gym_id      TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  name        TEXT NOT NULL,
  initials    TEXT DEFAULT '',
  role        TEXT DEFAULT 'Trainer',
  branch      TEXT DEFAULT '',
  members_count INTEGER DEFAULT 0,
  present     BOOLEAN DEFAULT true,
  salary      INTEGER DEFAULT 0,
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  joined      TEXT DEFAULT '',
  qr          TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. TRAINERS
CREATE TABLE trainers (
  id              TEXT PRIMARY KEY,
  gym_id          TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  name            TEXT NOT NULL,
  initials        TEXT DEFAULT '',
  specialization  TEXT DEFAULT '',
  experience      TEXT DEFAULT '',
  members         TEXT[] DEFAULT '{}',
  sessions        INTEGER DEFAULT 0,
  rating          NUMERIC(2,1) DEFAULT 0,
  commission      INTEGER DEFAULT 0,
  revenue         INTEGER DEFAULT 0,
  certifications  TEXT DEFAULT '',
  qr              TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. ATTENDANCE
CREATE TABLE attendance (
  id          TEXT PRIMARY KEY,
  gym_id      TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  member_id   TEXT NOT NULL REFERENCES members(id),
  member_name TEXT DEFAULT '',
  initials    TEXT DEFAULT '',
  check_in    TEXT DEFAULT '',
  date        TEXT DEFAULT '',
  trainer     TEXT DEFAULT '',
  method      TEXT DEFAULT 'QR',
  status      TEXT DEFAULT 'inside',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 7. PLANS
CREATE TABLE plans (
  id          SERIAL PRIMARY KEY,
  gym_id      TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  name        TEXT NOT NULL,
  days        INTEGER DEFAULT 30,
  price       INTEGER DEFAULT 0,
  pt          TEXT DEFAULT 'None',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 8. PAYMENTS
CREATE TABLE payments (
  id          SERIAL PRIMARY KEY,
  gym_id      TEXT NOT NULL REFERENCES gym_accounts(gym_id),
  member_name TEXT DEFAULT '',
  invoice     TEXT DEFAULT '',
  plan        TEXT DEFAULT '',
  amount      TEXT DEFAULT '',
  mode        TEXT DEFAULT '',
  date        TEXT DEFAULT '',
  status      TEXT DEFAULT 'Pending',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES for fast queries (all tables filter by gym_id)
-- ============================================================================
CREATE INDEX idx_members_gym    ON members(gym_id);
CREATE INDEX idx_staff_gym      ON staff(gym_id);
CREATE INDEX idx_trainers_gym   ON trainers(gym_id);
CREATE INDEX idx_attendance_gym ON attendance(gym_id);
CREATE INDEX idx_plans_gym      ON plans(gym_id);
CREATE INDEX idx_payments_gym   ON payments(gym_id);

-- ============================================================================
-- INSERT DEMO GYM ACCOUNTS (matches your hardcoded GYM_ACCOUNTS)
-- ============================================================================
INSERT INTO gym_accounts (gym_id, user_id, email, password, name, gym_name, city, role, is_new) VALUES
  ('GYM-001', 'usr_a1b2c3d4', 'raj@onlifit.com',   'Onlifit@2025', 'Rajesh Kumar', 'Onlifit',       'Bangalore', 'gym_owner', false),
  ('GYM-002', 'usr_b2c3d4e5', 'suresh@pzone.com',   'PowerZ@001',   'Suresh Nair',  'PowerZone Gym', 'Chennai',   'gym_owner', false),
  ('GYM-NEW', 'usr_new00001', 'demo@newgym.com',     'NewGym@001',   'Aryan Mehta',  'FitZone Pro',   'Pune',      'gym_owner', true);

-- Insert demo gym profile for GYM-001
INSERT INTO gym_profiles (gym_id, gym_name, city) VALUES
  ('GYM-001', 'Onlifit', 'Bangalore');

-- Insert seed members for GYM-001
INSERT INTO members (id, gym_id, name, initials, phone, email, plan, start_date, expiry_date, status, trainer, visits, dob) VALUES
  ('IQ-KRM-0001', 'GYM-001', 'Arjun Mehta',  'AM', '+91 98765 43210', 'arjun@gmail.com',  'Yearly',    'Jan 1',    'Dec 31',     'Active',  'Vikram Singh', 87,  '1992-04-12'),
  ('IQ-KRM-0002', 'GYM-001', 'Priya Sharma', 'PS', '+91 87654 32109', 'priya@gmail.com',  'Quarterly', 'Feb 1',    'Apr 30',     'Active',  'Pooja Reddy',  42,  '1995-09-20'),
  ('IQ-KRM-0003', 'GYM-001', 'Karan Patel',  'KP', '+91 76543 21098', 'karan@gmail.com',  'Monthly',   'Feb 15',   'Mar 14',     'Expired', 'Aryan Nair',   18,  '1998-01-05'),
  ('IQ-KRM-0004', 'GYM-001', 'Sneha Rao',    'SR', '+91 65432 10987', 'sneha@gmail.com',  'Yearly',    'Jan 10',   'Jan 9 26',   'Active',  'Vikram Singh', 63,  '1993-11-30'),
  ('IQ-KRM-0005', 'GYM-001', 'Mohit Jain',   'MJ', '+91 54321 09876', 'mohit@gmail.com',  'Monthly',   'Mar 1',    'Mar 31',     'Active',  'Pooja Reddy',  9,   '2000-07-14'),
  ('IQ-KRM-0006', 'GYM-001', 'Divya Nair',   'DN', '+91 43210 98765', 'divya@gmail.com',  'Quarterly', 'Dec 1',    'Feb 28',     'Expired', 'Aryan Nair',   34,  '1996-03-22'),
  ('IQ-KRM-0007', 'GYM-001', 'Rohan Gupta',  'RG', '+91 32109 87654', 'rohan@gmail.com',  'Yearly',    'Mar 1',    'Feb 28 26',  'Frozen',  'Vikram Singh', 156, '1990-08-18');

-- Insert seed staff for GYM-001
INSERT INTO staff (id, gym_id, name, initials, role, branch, members_count, present, salary, phone, email, joined, qr) VALUES
  ('ST-001', 'GYM-001', 'Vikram Singh', 'VS', 'Head Trainer',  'Koramangala', 24, true, 45000, '+91 98100 11001', 'vikram@onlifit.com', 'Jan 2023', 'QR-ST-001'),
  ('ST-002', 'GYM-001', 'Pooja Reddy',  'PR', 'PT Trainer',    'Koramangala', 18, true, 32000, '+91 98100 11002', 'pooja@onlifit.com',  'Mar 2023', 'QR-ST-002'),
  ('ST-003', 'GYM-001', 'Aryan Nair',   'AN', 'Trainer',       'Koramangala', 20, true, 30000, '+91 98100 11003', 'aryan@onlifit.com',  'Jun 2023', 'QR-ST-003');

-- Insert seed trainers for GYM-001
INSERT INTO trainers (id, gym_id, name, initials, specialization, experience, members, sessions, rating, commission, revenue, certifications, qr) VALUES
  ('TR-001', 'GYM-001', 'Vikram Singh', 'VS', 'Strength & Conditioning', '8 years', ARRAY['IQ-KRM-0001','IQ-KRM-0004'], 28, 4.9, 500, 14000, 'NSCA-CPT, ACSM',               'QR-TR-001'),
  ('TR-002', 'GYM-001', 'Pooja Reddy',  'PR', 'Weight Loss & Nutrition',  '5 years', ARRAY['IQ-KRM-0002','IQ-KRM-0005'], 20, 4.8, 400, 8000,  'ACE-CPT, Precision Nutrition', 'QR-TR-002'),
  ('TR-003', 'GYM-001', 'Aryan Nair',   'AN', 'Functional & Crossfit',    '4 years', ARRAY['IQ-KRM-0007'],               14, 4.7, 350, 4900,  'CrossFit L2',                  'QR-TR-003');

-- Insert seed plans for GYM-001
INSERT INTO plans (gym_id, name, days, price, pt) VALUES
  ('GYM-001', 'Monthly',      30,  1500,  'None'),
  ('GYM-001', 'Quarterly',    90,  4000,  'None'),
  ('GYM-001', 'Yearly',       365, 14000, '4 Sessions'),
  ('GYM-001', 'Student Pack', 30,  999,   'None');

-- Insert seed payments for GYM-001
INSERT INTO payments (gym_id, member_name, invoice, plan, amount, mode, date, status) VALUES
  ('GYM-001', 'Arjun Mehta', 'INV-0347', 'Yearly',    '₹14,000', 'UPI',  'Mar 9', 'Paid'),
  ('GYM-001', 'Sneha Rao',   'INV-0346', 'Yearly',    '₹14,000', 'Card', 'Mar 8', 'Paid'),
  ('GYM-001', 'Mohit Jain',  'INV-0345', 'Monthly',   '₹1,500',  'Cash', 'Mar 8', 'Paid'),
  ('GYM-001', 'Aisha Khan',  'INV-0344', 'Quarterly', '₹4,000',  'UPI',  'Mar 7', 'Pending');

-- Insert seed attendance for GYM-001
INSERT INTO attendance (id, gym_id, member_id, member_name, initials, check_in, date, trainer, method, status) VALUES
  ('att001', 'GYM-001', 'IQ-KRM-0001', 'Arjun Mehta',  'AM', '6:02 AM', 'Today', 'Vikram Singh', 'QR',     'inside'),
  ('att002', 'GYM-001', 'IQ-KRM-0002', 'Priya Sharma', 'PS', '6:15 AM', 'Today', 'Pooja Reddy',  'QR',     'inside'),
  ('att003', 'GYM-001', 'IQ-KRM-0004', 'Sneha Rao',    'SR', '7:00 AM', 'Today', 'Vikram Singh', 'QR',     'inside'),
  ('att004', 'GYM-001', 'IQ-KRM-0005', 'Mohit Jain',   'MJ', '7:30 AM', 'Today', 'Pooja Reddy',  'Manual', 'left'),
  ('att005', 'GYM-001', 'IQ-KRM-0007', 'Rohan Gupta',  'RG', '8:00 AM', 'Today', 'Aryan Nair',   'QR',     'left'),
  ('att006', 'GYM-001', 'IQ-KRM-0001', 'Arjun Mehta',  'AM', '6:10 AM', 'Mar 9', 'Vikram Singh', 'QR',     'left'),
  ('att007', 'GYM-001', 'IQ-KRM-0002', 'Priya Sharma', 'PS', '6:45 AM', 'Mar 9', 'Pooja Reddy',  'QR',     'left'),
  ('att008', 'GYM-001', 'IQ-KRM-0004', 'Sneha Rao',    'SR', '7:15 AM', 'Mar 9', 'Vikram Singh', 'QR',     'left'),
  ('att009', 'GYM-001', 'IQ-KRM-0001', 'Arjun Mehta',  'AM', '6:05 AM', 'Mar 8', 'Vikram Singh', 'QR',     'left'),
  ('att010', 'GYM-001', 'IQ-KRM-0007', 'Rohan Gupta',  'RG', '7:00 AM', 'Mar 8', 'Aryan Nair',   'QR',     'left');
