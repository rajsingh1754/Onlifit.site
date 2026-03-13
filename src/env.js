// Environment variable validation — runs at app startup
// Warns about missing config instead of silently failing

const required = [
  { key: 'VITE_SUPABASE_URL',      label: 'Supabase URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
];

const optional = [
  { key: 'VITE_SENTRY_DSN',        label: 'Sentry DSN (error tracking)' },
  { key: 'VITE_RAZORPAY_KEY_ID',   label: 'Razorpay Key (payments)' },
  { key: 'VITE_ADMIN_EMAILS',      label: 'Admin emails (owner panel)' },
  { key: 'VITE_APP_VERSION',       label: 'App version' },
];

export function validateEnv() {
  const missing = [];
  const warnings = [];

  for (const { key, label } of required) {
    if (!import.meta.env[key]) {
      missing.push(`  ❌ ${key} — ${label}`);
    }
  }

  for (const { key, label } of optional) {
    if (!import.meta.env[key]) {
      warnings.push(`  ⚠️ ${key} — ${label}`);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n🚨 ONLIFIT — Missing required environment variables:\n${missing.join('\n')}\n\nAdd them to your .env file or Vercel dashboard.\n`
    );
  }

  if (warnings.length > 0 && import.meta.env.DEV) {
    console.warn(
      `\n⚙️ ONLIFIT — Optional env vars not set (features disabled):\n${warnings.join('\n')}\n`
    );
  }

  return missing.length === 0;
}
