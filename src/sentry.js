import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  console.log("[Sentry] DSN:", SENTRY_DSN ? "✅ configured" : "❌ missing");
  if (!SENTRY_DSN) {
    console.warn("[Sentry] No DSN configured — error tracking disabled. Set VITE_SENTRY_DSN to enable.");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE, // 'development' or 'production'
    release: `onlifit@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.2,       // 20% of transactions
    replaysSessionSampleRate: 0,  // don't record normal sessions
    replaysOnErrorSampleRate: 1.0, // record 100% of sessions with errors
    beforeSend(event) {
      // Scrub any Supabase keys from error payloads
      if (event.request?.headers) {
        delete event.request.headers['apikey'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });
}

// Tag errors with gym context for filtering in Sentry dashboard
export function setGymContext(gymId, gymName) {
  if (!SENTRY_DSN) return;
  Sentry.setTag("gym_id", gymId);
  Sentry.setTag("gym_name", gymName);
  Sentry.setUser({ id: gymId, username: gymName });
}

export function captureError(error, context = {}) {
  console.error("[Onlifit Error]", error, context);
  if (!SENTRY_DSN) return;
  Sentry.captureException(error, { extra: context });
}

export { Sentry };
