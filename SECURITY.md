# SECURITY.md — SalesPilot CRM

This document consolidates all security hardening measures implemented across Phases 1–4.

---

## Phase 1 — Authentication & Core Security

### Authentication
- Passwords hashed with **bcrypt (cost 12)** — never stored in plaintext
- **JWT access tokens** expire in 15 minutes
- **Refresh tokens** are random 64-byte hex strings stored hashed in the database with a 7-day expiry
- Constant-time password comparison path on unknown users (timing-attack mitigation)
- **Rate limiting** on `/api/auth/login`: 5 attempts per IP per 15 minutes

### Token storage
- **Access token**: lives in React state (memory only) + a short-lived browser cookie for middleware-side route protection. Never written to disk.
- **Refresh token**: encrypted at rest using **Electron's `safeStorage` API** (Windows Credential Manager). Stored at `%APPDATA%/SalesPilot/rt.enc`. A different OS user cannot decrypt it.

### IPC security
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on the BrowserWindow
- Preload script exposes a **strict channel allowlist** via `contextBridge`. Unlisted channels throw immediately.
- No `eval`, no dynamic `require` in the renderer

### Input validation
- Every form uses **Zod** schemas on both client and server
- All database queries go through **Prisma** (parameterized queries). No raw SQL template strings.

### Secrets
- `.env` is gitignored. `.env.example` has only placeholder values.

---

## Phase 3 — Payments (PCI Compliance Measures)

### Card data — never touches our database
- Raw card numbers and full payment details are **never stored**. Only Stripe/PayPal return values (transaction IDs, last 4 digits, status) are persisted.
- Stripe handles the actual card data. PCI DSS SAQ A applies (redirect/iframe model).

### Webhook signature verification
- **Stripe**: `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)` — verifies HMAC-SHA256 signature on every webhook before processing.
- **PayPal**: `/v1/notifications/verify-webhook-signature` — PayPal server-side signature check before processing.
- Both webhook routes export `export const dynamic = 'force-dynamic'` to preserve the raw body for signature verification.
- Any webhook that fails verification returns `400` immediately — no processing occurs.

### PDF injection prevention
- All user-input fields are passed through `sanitize()` in `src/lib/pdf.ts` before rendering.
- `sanitize()` strips control characters (`\x00–\x1F`, `\x7F–\x9F`) and truncates to 2000 characters.

### Refund authorization (RBAC)
- Only `ADMIN` and `MANAGER` roles can call `/api/payments/[id]/refund`.
- All other roles receive `403 Forbidden`.

### Payment credentials
- Stripe and PayPal are in sandbox/test mode. Real credentials must never be committed.
- Environment variables `STRIPE_SECRET_KEY` and `PAYPAL_CLIENT_SECRET` are never logged or exposed in API responses.

---

## Phase 4 — Team, Documents, Chat, Admin, Settings

### Activity Logs — append-only audit trail
- `src/lib/activity-log.ts` only ever calls `db.activityLog.create()`. No UPDATE or DELETE code paths exist anywhere in the codebase for this model.
- The API route `/api/activity-logs` exposes GET only. There are intentionally no POST/PATCH/DELETE routes.
- **Role changes** are always logged with `action: ROLE_CHANGE` and a `{ from, to }` metadata payload, ensuring privilege escalation is traceable.

### API Key encryption at rest
- API keys are encrypted with **AES-256-GCM** (`src/lib/encryption.ts`) before being written to the database.
- Only the `maskedKey` (last 4 characters, prefixed with `*`) is returned by GET endpoints. The `encryptedKey` column is never included in SELECT results.
- **Revealing a key requires password re-authentication**: `POST /api/settings/api-keys/[id]` requires the user's account password (bcrypt-verified). On success, the decrypted key is returned once and logged (`VIEW_SENSITIVE` activity log).
- The `ENCRYPTION_KEY` environment variable must be a 64-char hex string (32 bytes). The app throws on startup if it's the default placeholder.

### Admin Panel — no raw SQL
- The Database Management section in the Admin Panel offers **backup (JSON export via Prisma) and restore only**.
- There is no raw SQL query input anywhere in the UI. All data access is through Prisma ORM.
- Backup files are exported as JSON via controlled, parameterized Prisma queries.

### Chat message sanitization (XSS prevention)
- All chat messages are sanitized server-side with **`isomorphic-dompurify`** before storage: `DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })`.
- This strips all HTML tags, rendering only plain text. Even if the client renders content as HTML in the future, stored content is already clean.

### Socket.io authentication
- The Socket.io server (`electron/utils/socketServer.ts`) requires a valid JWT in the handshake `auth.token` field.
- Connections without a valid token are rejected with `Authentication required`.

### File upload security
- Uploaded files are stored with randomized filenames (`Date.now() + 8 random bytes + extension`) to prevent path prediction.
- The file serving route (`/api/documents/file/[...path]`) uses `path.basename()` on each segment to prevent directory traversal attacks.

### Role changes logged
- Every role change via `/api/admin/users/[id]/role` writes a `ROLE_CHANGE` activity log entry with the `from` and `to` role values.

---

## Known Limitations

### Client-side protection
- Desktop binaries can be reverse-engineered. License key checks are a deterrent, not a guarantee.
- `safeStorage` protects against other OS users, not against an attacker who has a shell as the same OS user.

### Network
- All traffic is loopback (localhost only). The Next.js server binds to `127.0.0.1`, not `0.0.0.0`.
- No TLS locally (unnecessary for loopback). Add TLS if you ever expose the API to a network.

### Feature stubs (not yet production-ready)
- **OCR** (`src/lib/ocr.ts`): returns `null` — connect Tesseract.js or a cloud OCR service before enabling in production.
- **WhatsApp/SMS campaigns**: return `501 Not Implemented` — wire a real provider (Twilio, etc.) before enabling.
- **Video calls**: not implemented — a placeholder exists in the Communication module. Add WebRTC or a third-party SDK.
- **In-memory rate limiter**: survives restarts poorly. Replace with Redis for multi-instance deployments.

---

## Recommended Future Hardening

1. Replace in-memory rate limiter with Redis
2. Add row-level access control (Prisma query middleware)
3. Wire license validation to a server endpoint
4. Add HTTPS/TLS if exposing to a network
5. Rotate JWT secrets via an env-var rotation mechanism
6. Code-sign the installer with an EV certificate (removes SmartScreen warnings)
