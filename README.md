# SalesPilot CRM

A full-featured Windows desktop CRM built with **Electron 33**, **Next.js 15**, **Prisma 5**, and **PostgreSQL**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Development)](#quick-start-development)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Phase Overview](#phase-overview)
6. [Building the Installer](#building-the-installer)
7. [Architecture](#architecture)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 15+ |
| Windows | 10 / 11 |

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Edit .env — see Environment Variables section below

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations (creates all tables)
npx prisma migrate deploy

# 5. Start the app in dev mode
npm run dev
```

The Next.js server runs on **http://localhost:3000**.
The Socket.io server (internal chat) runs on **http://localhost:3001**.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 64-byte hex string for JWT signing |
| `OPENAI_API_KEY` | OpenAI key for AI Assistant (Phase 2) |
| `STRIPE_SECRET_KEY` | Stripe secret key — test only: `sk_test_…` (Phase 3) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (Phase 3) |
| `PAYPAL_CLIENT_ID` | PayPal sandbox client ID (Phase 3) |
| `PAYPAL_CLIENT_SECRET` | PayPal sandbox client secret (Phase 3) |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID (Phase 3) |
| `UPLOAD_DIR` | Directory for uploaded files (default: `./uploads`) (Phase 4) |
| `ENCRYPTION_KEY` | 64-char hex (32 bytes) for AES-256-GCM API key encryption (Phase 4) |
| `SOCKET_PORT` | Socket.io server port (default: `3001`) (Phase 4) |
| `NEXT_PUBLIC_SOCKET_PORT` | Same value, exposed to the browser (Phase 4) |

Generate a secure encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

```bash
# Apply all migrations
npx prisma migrate deploy

# Open Prisma Studio (optional)
npx prisma studio
```

---

## Phase Overview

| Phase | Modules |
|-------|---------|
| Phase 1 | Auth (JWT + refresh tokens), Users/Roles (RBAC), Customers, Leads, Pipeline (Kanban), Deals, Calendar, Email (SMTP/IMAP) |
| Phase 2 | AI Assistant (OpenAI GPT-4o), AI-powered email compose, Contacts |
| Phase 3 | Products & Categories, Quotations (PDF), Invoices (PDF), Payments (Stripe + PayPal), Reports (charts) |
| Phase 4 | Team Management (departments, employees, activity logs), Task Management (Kanban), Documents (file upload, versioning), Communication (Socket.io chat), Marketing (email campaigns), Admin Panel (user management, DB backup), Settings (company, encrypted API keys) |

---

## Building the Installer

```bash
# 1. Build Next.js
npx next build

# 2. Compile TypeScript (Electron main process)
npx tsc --project tsconfig.electron.json

# 3. Build Windows installer
npx electron-builder --win
```

Output: `dist-package/SalesPilot CRM Setup 1.0.0.exe`

---

## Architecture

```
SalesPilot/
├── electron/
│   ├── main.ts              # App entry — starts Next.js + Socket.io
│   ├── preload.ts           # Context bridge (IPC exposed to renderer)
│   ├── ipc/                 # IPC handlers
│   └── utils/
│       ├── serverManager.ts # Starts Next.js standalone server
│       ├── socketServer.ts  # Socket.io on port 3001 (Phase 4)
│       └── license.ts       # License validation
├── src/
│   ├── app/
│   │   ├── api/             # REST API routes (Next.js Route Handlers)
│   │   └── (protected)/     # Authenticated pages
│   ├── components/          # Shared UI (shadcn/ui based)
│   ├── hooks/               # React Query hooks per domain
│   └── lib/                 # Server utilities
│       ├── auth.ts          # JWT verification
│       ├── db.ts            # Prisma client singleton
│       ├── pdf.ts           # PDF generation (pdfkit)
│       ├── stripe.ts        # Stripe lazy initializer
│       ├── paypal.ts        # PayPal REST API
│       ├── email.ts         # SMTP/IMAP (nodemailer)
│       ├── encryption.ts    # AES-256-GCM for API keys (Phase 4)
│       ├── activity-log.ts  # Append-only audit log writer (Phase 4)
│       └── document-storage.ts # File upload/storage (Phase 4)
└── prisma/
    └── schema.prisma        # 30+ models, 15+ enums
```

### Key Ports

| Service | Port |
|---------|------|
| Next.js (app server) | 3000 |
| Socket.io (chat) | 3001 |
