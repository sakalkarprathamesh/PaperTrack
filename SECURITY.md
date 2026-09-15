# PaperTrack Security Audit & Architecture

This document details the security architecture, role isolation boundaries, data privacy protections, and production security controls for **PaperTrack** — the dedicated Lokmat Newspaper Distribution & Billing Management Application.

---

## 1. Security Architecture Matrix

| Security Layer | Threat Vector | Mitigation Strategy | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Edge Routing** | Unauthorized route access, URL tampering | Next.js Edge Middleware (`src/middleware.ts`) | Inspects `papertrack_role` and session cookies before rendering any page. Redirects unauthenticated users to `/login` and unauthorized roles to `/unauthorized`. |
| **Layout Level** | Direct client-side navigation bypass | Client Layout Guards (`src/app/*/layout.tsx`) | `AdminLayout`, `DeliveryLayout`, and `CustomerLayout` verify active user role in `useAuth()` and trigger immediate redirect to `/unauthorized` if mismatch occurs. |
| **Role Switcher** | Privilege escalation in production | Production Environment Lock | Role switcher in `AdminTopbar`, `DeliveryNav`, and `CustomerNav` is strictly hidden in production unless explicitly enabled via `NEXT_PUBLIC_ENABLE_DEMO_SWITCHER=true`. |
| **Database Security** | Direct database tampering or data leaks | Row Level Security (RLS) on Supabase PostgreSQL | Tables have active RLS. Anon key has strictly scoped permissions; service-role key is never bundled into client JavaScript. |
| **Financial Ledger** | Accidental data loss or record tampering | Non-destructive Accounting Pattern | Deletion of payments is strictly prohibited. Corrupted entries are recorded as `REVERSED` with linked audit trails. Carry-forwards and advances are computed chronologically. |
| **Data Privacy & SEO**| Search engine indexing of customer names/addresses | Robots & Headers Protection | `src/app/robots.ts` disallows all private routes (`/admin/`, `/delivery/`, `/customer/`, `/api/`). Middleware injects `X-Robots-Tag: noindex, nofollow, noarchive`. |
| **File Uploads** | Malicious script or huge file DoS | Extension, MIME & 5MB Limit Enforcement | File upload in `/admin/import` checks `file.size <= 5 * 1024 * 1024` (5MB), enforces `.csv`/`.txt` extension, and validates CSV header columns prior to parsing. |
| **Error Handling** | Stack trace & DB schema leakage | Production Error Boundaries | `error.tsx`, `global-error.tsx`, and `not-found.tsx` display polite, localized error messages without exposing internals. |

---

## 2. Role-Based Access Control (RBAC) Specification

PaperTrack enforces three non-overlapping user roles:

### A. Admin (Agency Owner)
- **Authorized Routes**: `/admin/*`
- **Capabilities**:
  - Full view and management of all subscribers and route assignments
  - Access to monthly billing generation and payment receipts
  - Access to daily cash/UPI collection register
  - Access to WhatsApp reminder generator
  - Access to customer ledger, statements, audit timeline, and CSV exports
  - Access to CSV diary import (with 5MB file validation)
  - Agency settings configuration (agency name, UPI ID, default Lokmat rate ₹5/day)
- **Restrictions**:
  - Cannot delete finalized financial records (audit-first reversal only)

### B. Delivery Staff (Route Boys)
- **Authorized Routes**: `/delivery/*`
- **Capabilities**:
  - Morning checklist of assigned customers for daily delivery marking (Delivered ₹5 / Not Delivered ₹0)
  - Mark holiday/paused delivery
  - View assigned customer route sequence and phone numbers
- **Forbidden Routes**:
  - All `/admin/*` routes (e.g., cannot view overall agency ledger, settings, or bulk exports)
  - All `/customer/*` routes

### C. Customer (Subscriber)
- **Authorized Routes**: `/customer/*`
- **Capabilities**:
  - View personal subscription details and Lokmat delivery calendar
  - View personal monthly bills and download statements
  - View personal payment receipts and advance credit balance
  - Request vacation hold / temporary pause
- **Forbidden Routes**:
  - All `/admin/*` routes
  - All `/delivery/*` routes
  - Cannot access other customers' records or balances

---

## 3. Data Privacy & Customer Confidentiality

- **Customer PII Safeguards**: Customer phone numbers and addresses are strictly confined to authorized delivery and admin dashboards.
- **Search Engine Blocking**:
  - `User-agent: *`
  - `Disallow: /admin/`
  - `Disallow: /delivery/`
  - `Disallow: /customer/`
  - `Disallow: /api/`
  - `Disallow: /unauthorized`
- **HTTP Security Headers**:
  - `X-Robots-Tag: noindex, nofollow, noarchive`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 4. Financial Record Protection & Integrity Rules

1. **₹5 Lokmat Daily Calculation**: Daily delivery charges are fixed at ₹5.00/day. Unmarked or Not Delivered days are ₹0.00.
2. **Prior Balance Carry-Forward**: Unpaid past balances are automatically carried forward into subsequent monthly bills.
3. **Advance Balances**: Excess payments over bill amounts are credited towards the subscriber's advance balance and deducted from subsequent bills.
4. **Audit Immutability**: All payment records, reversals, vacation holds, and profile changes generate immutable entries in the audit trail.
5. **No Drop / No Truncate**: Production database tables (`customers`, `bills`, `payments`, `delivery_records`, `subscriptions`, `audit_logs`) are never dropped or truncated.

---

## 5. Security Incident Response & Verification

In case of suspected credential compromise or unauthorized access:
1. Immediately rotate the Supabase JWT secret in the Supabase Dashboard.
2. Invalidate active sessions by clearing application cookies (`papertrack_role`, `papertrack_user_id`).
3. Verify that `NEXT_PUBLIC_ENABLE_DEMO_SWITCHER` is set to `false` in Vercel / production environment variables.
4. Review recent entries in `/admin/activity` for suspicious status modifications or reversals.
