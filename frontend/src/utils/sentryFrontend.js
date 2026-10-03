// frontend/src/utils/sentryFrontend.js
// Sentry initializer and PII scrubber for the Fixvo React frontend.

const REDACTED_FIELDS = new Set([
  'password', 'confirmPassword', 'currentPassword', 'newPassword',
  'token', 'accessToken', 'authToken', 'jwtToken', 'refreshToken',
  'phone', 'phoneNumber', 'mobile',
  'cardNumber', 'cvv', 'expiryDate',
  'aadhaarNumber', 'panNumber', 'accountNumber', 'ifscCode',
  'latitude', 'longitude', 'lat', 'lng',
  'razorpay_signature', 'client_secret'
]);

function scrubObject(obj, depth = 0) {
  if (depth > 8 || !obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => scrubObject(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = REDACTED_FIELDS.has(k) ? '[REDACTED]' : scrubObject(v, depth + 1);
  }
  return out;
}

function scrubFrontendEvent(event) {
  if (!event) return event;
  try {
    if (event.request) {
      event.request.data = undefined;
      event.request.cookies = '[REDACTED]';
      event.request.query_string = '[REDACTED]';
      if (event.request.headers && event.request.headers['Authorization']) {
        event.request.headers['Authorization'] = '[REDACTED]';
      }
    }
    if (event.extra) event.extra = scrubObject(event.extra);
    if (event.user) {
      const { id } = event.user;
      event.user = id ? { id } : undefined;
    }
    if (event.breadcrumbs?.values) {
      event.breadcrumbs.values = event.breadcrumbs.values.map(crumb => {
        if (crumb.data) crumb.data = scrubObject(crumb.data);
        return crumb;
      });
    }
  } catch (err) {
    return null;
  }
  return event;
}

// Fallback Sentry wrapper if @sentry/react is not installed
const SentryMock = {
  init: (opts) => {
    console.log('[SentryFrontend] Initialized in mock mode (DSN:', opts?.dsn ? 'configured' : 'none', ')');
  },
  ErrorBoundary: ({ children }) => children,
  addBreadcrumb: (crumb) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[SentryBreadcrumb]', crumb);
    }
  },
  captureException: (err, ctx) => {
    console.error('[SentryCapture]', err, ctx);
  },
  setUser: (user) => {
    if (user?.id) {
      console.log('[SentryUser] Set user id:', user.id);
    }
  }
};

export const Sentry = SentryMock;

export function initSentry() {
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  Sentry.init({
    dsn: dsn || '',
    enabled: Boolean(dsn),
    environment: import.meta.env?.MODE || 'development',
    beforeSend: scrubFrontendEvent
  });
}

export function setSentryUser(user) {
  if (user) {
    Sentry.setUser({ id: user._id || user.id || user.userId });
  } else {
    Sentry.setUser(null);
  }
}
