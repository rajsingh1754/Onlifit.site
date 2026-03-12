-- ═══════════════════════════════════════════════════════════════════════════════
-- ONLIFIT SUPPORT SYSTEM — Tables + RPCs
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── TABLES ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id           SERIAL PRIMARY KEY,
  ticket_id    TEXT UNIQUE NOT NULL,
  gym_id       TEXT NOT NULL,
  gym_name     TEXT,
  subject      TEXT NOT NULL,
  priority     TEXT DEFAULT 'medium',
  status       TEXT DEFAULT 'open',
  created_at   TIMESTAMPTZ DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_messages (
  id           SERIAL PRIMARY KEY,
  ticket_id    TEXT NOT NULL,
  sender       TEXT NOT NULL,        -- 'gym' or 'admin'
  sender_name  TEXT,
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;

-- ── RPCs ─────────────────────────────────────────────────────────────────────

-- Create a new support ticket + first message
CREATE OR REPLACE FUNCTION create_support_ticket(
  p_gym_id TEXT, p_gym_name TEXT, p_subject TEXT, p_priority TEXT, p_message TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id TEXT;
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM support_tickets;
  v_ticket_id := 'TKT-' || LPAD(v_count::TEXT, 4, '0');
  INSERT INTO support_tickets (ticket_id, gym_id, gym_name, subject, priority)
  VALUES (v_ticket_id, p_gym_id, p_gym_name, p_subject, p_priority);
  INSERT INTO support_messages (ticket_id, sender, sender_name, message)
  VALUES (v_ticket_id, 'gym', p_gym_name, p_message);
  RETURN v_ticket_id;
END;
$$;

-- Get tickets for a specific gym
CREATE OR REPLACE FUNCTION get_support_tickets(p_gym_id TEXT)
RETURNS SETOF support_tickets
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM support_tickets WHERE gym_id = p_gym_id ORDER BY created_at DESC;
$$;

-- Get ALL tickets (for owner/admin panel)
CREATE OR REPLACE FUNCTION get_all_support_tickets()
RETURNS SETOF support_tickets
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM support_tickets ORDER BY
    CASE WHEN status = 'open' THEN 0 ELSE 1 END,
    created_at DESC;
$$;

-- Get messages for a ticket
CREATE OR REPLACE FUNCTION get_support_messages(p_ticket_id TEXT)
RETURNS SETOF support_messages
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM support_messages WHERE ticket_id = p_ticket_id ORDER BY created_at ASC;
$$;

-- Send a message in a ticket
CREATE OR REPLACE FUNCTION send_support_message(
  p_ticket_id TEXT, p_sender TEXT, p_sender_name TEXT, p_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO support_messages (ticket_id, sender, sender_name, message)
  VALUES (p_ticket_id, p_sender, p_sender_name, p_message);
  -- Re-open ticket if gym sends a new message on a resolved ticket
  IF p_sender = 'gym' THEN
    UPDATE support_tickets SET status = 'open', resolved_at = NULL WHERE ticket_id = p_ticket_id AND status = 'resolved';
  END IF;
END;
$$;

-- Resolve a ticket
CREATE OR REPLACE FUNCTION resolve_support_ticket(p_ticket_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE support_tickets SET status = 'resolved', resolved_at = now() WHERE ticket_id = p_ticket_id;
  INSERT INTO support_messages (ticket_id, sender, sender_name, message)
  VALUES (p_ticket_id, 'admin', 'Onlifit Support', '✅ This ticket has been resolved. Feel free to reopen if needed.');
END;
$$;
