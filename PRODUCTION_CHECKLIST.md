# PaperTrack Production Pilot Pre-Flight Checklist

This checklist must be reviewed and signed off prior to launching PaperTrack with live delivery staff and subscribers.

---

## 1. Security & Route Protection

- [x] **1.1 Edge Middleware Active**: Next.js Edge Middleware (`src/middleware.ts`) intercepts all routes and enforces role boundaries (`/admin/*`, `/delivery/*`, `/customer/*`).
- [x] **1.2 403 Access Denied Page**: Custom unauthorized page (`src/app/unauthorized/page.tsx`) displays polite guidance without leaking internal system paths.
- [x] **1.3 Client Layout Role Guards**: `AdminLayout`, `DeliveryLayout`, and `CustomerLayout` verify active user session and redirect cross-role access attempts.
- [x] **1.4 Demo Role Switcher Hidden**: Demo role switcher is hidden in production (`process.env.NODE_ENV === 'production' && NEXT_PUBLIC_ENABLE_DEMO_SWITCHER !== 'true'`).
- [x] **1.5 Secure Authentication Cookies**: User role and ID cookies (`papertrack_role`, `papertrack_user_id`) use `SameSite=Lax` and match backend session state.

---

## 2. Database & Financial Record Integrity

- [x] **2.1 Database Non-Destruction**: Existing Supabase tables (`customers`, `bills`, `payments`, `delivery_records`, `subscriptions`) are untouched (no drops or resets).
- [x] **2.2 Rate Calculation Integrity**: Daily Lokmat delivery is locked at ₹5.00/day. Days marked as "Not Delivered" or unmarked calculate as ₹0.00.
- [x] **2.3 Prior Balance Carry-Forward**: Unpaid balances from previous months are carried forward into new bills.
- [x] **2.4 Advance Payment Credit**: Overpayments automatically credit the subscriber's advance balance and deduct from subsequent bills.
- [x] **2.5 Non-Destructive Payment Reversals**: Receipts cannot be deleted. Erroneous records are reversed via audit trail entries.

---

## 3. Multilingual System & Localisation

- [x] **3.1 English (Default)**: Complete English terminology across Admin, Delivery Staff, and Customer views.
- [x] **3.2 Marathi (मराठी)**: High-quality, culturally natural Marathi translation across all modules and navigation labels.
- [x] **3.3 Hindi (हिन्दी)**: Accurate Hindi terminology across all modules and navigation labels.
- [x] **3.4 Dynamic Language Switcher**: Persistent language selector (`src/components/layout/LanguageSwitcher.tsx`) in all navigation bars with `localStorage` and cookie persistence.
- [x] **3.5 Currency & Date Formatting**: Indian Rupee (`₹`) and regional date formatting (`en-IN`, `mr-IN`, `hi-IN`) with Devanagari typography support.

---

## 4. Operational Features & Daily Workflow

- [x] **4.1 Delivery Checklist**: Delivery boys can access `/delivery/today` on mobile and mark morning delivery with a single tap.
- [x] **4.2 WhatsApp Reminders**: Direct single-click `wa.me` links pre-filled with customer outstanding dues and agency UPI details.
- [x] **4.3 Monthly Bill Generation**: Batch calculation of monthly bills based on actual delivery days.
- [x] **4.4 Customer Ledger & Statement**: Printable statement of account showing debits, credits, and running balance.
- [x] **4.5 Data Export (CSV)**: Export customer balances, bill register, and daily collections to CSV for local backup.

---

## 5. Data Privacy & Error Boundaries

- [x] **5.1 Search Engine Disallow**: `src/app/robots.ts` disallows all private agency routes (`/admin/`, `/delivery/`, `/customer/`, `/api/`).
- [x] **5.2 Privacy Headers**: Edge Middleware applies `X-Robots-Tag: noindex, nofollow, noarchive` and frame-busting security headers.
- [x] **5.3 File Upload Restrictions**: CSV diary import (`/admin/import`) strictly enforces a 5MB maximum file size and checks file extensions.
- [x] **5.4 Production Error Boundaries**: Graceful error handling in `src/app/error.tsx` and `src/app/global-error.tsx` without exposing stack traces.
- [x] **5.5 Zero PII Leakage**: No private customer addresses or contact details exposed on public endpoints.

---

## Pilot Sign-Off

| Milestone | Target Date | Verified By | Status |
| :--- | :--- | :--- | :--- |
| **Pre-Flight Test Suite** | Immediate | Automated Test Suite (Vitest) | Passed |
| **Admin Onboarding** | Day 1 | Agency Owner (Admin) | Ready |
| **Delivery Staff Mobile Test**| Day 1 | Route Supervisor | Ready |
| **Subscriber Portal Soft-Launch**| Day 3 | Pilot Subscribers | Ready |
