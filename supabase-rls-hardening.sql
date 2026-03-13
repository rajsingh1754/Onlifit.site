-- ═══════════════════════════════════════════════════════════════════════════════
-- ONLIFIT — Row-Level Security (RLS) Hardening
-- Run this in Supabase SQL Editor AFTER all other schema migrations
-- This ensures no gym can ever read/modify another gym's data
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Enable RLS on all tables ──────────────────────────────────────────────

ALTER TABLE gym_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_salary       ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins    ENABLE ROW LEVEL SECURITY;

-- ── 2. Deny all direct table access (force RPC usage) ───────────────────────
-- Since ALL operations go through SECURITY DEFINER RPCs, we don't need
-- any SELECT/INSERT/UPDATE/DELETE policies for the `authenticated` role.
-- RLS being enabled with NO policies = complete lockdown on direct access.
-- The SECURITY DEFINER RPCs bypass RLS and execute as the function owner.

-- ── 3. Service role bypass (for Supabase dashboard & migrations) ────────────
-- The `service_role` can always bypass RLS — no policy needed.
-- This is Supabase's default behavior.

-- ── 4. Verify: list all tables and their RLS status ─────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: all tables should show rowsecurity = true
-- If any show false, run: ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- IMPORTANT NOTES:
--
-- 1. All your RPCs use SECURITY DEFINER — they run as the DB owner and
--    bypass RLS. This is correct and intentional.
--
-- 2. With RLS enabled + no policies, the `authenticated` role CANNOT:
--    - supabase.from('gym_members').select('*')  → returns empty []
--    - supabase.from('gym_payments').insert(...)  → permission denied
--    Only supabase.rpc('...') calls work (which is what the app uses).
--
-- 3. Each RPC already filters by gym_id parameter, ensuring data isolation.
--
-- 4. If you ever add a new table, remember to:
--    ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
-- ═══════════════════════════════════════════════════════════════════════════════
