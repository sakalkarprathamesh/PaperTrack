# PaperTrack: Newspaper Distribution & Billing Management

> **Subtitle:** Newspaper Distribution & Billing Management  
> **Brand Identity:** Editorial newspaper-inspired design (Red `#B91C1C`, Soft Gray, White Cards, Ink Typography)  
> **Target Agency:** Lokmat Newspaper Distribution Agency (200–500 subscribers, ₹5/day rate)

PaperTrack is a production-grade full-stack web application designed to replace the traditional handwritten distribution diary used by newspaper agency owners. It manages daily newspaper delivery tracking, actual delivered days billing calculations, carry-forward unpaid balances, cash/UPI payments with FIFO allocation and advance credit support, delivery boy route assignments, and a private subscriber self-service portal.

---

## 🌟 Key Features

### 1. Daily Delivery Desk (`/admin/delivery` & `/delivery/today`)
- **Actual Delivered Days Tracking**: Only copies with `status = 'DELIVERED'` are billed.
- **1-Tap Morning Actions**: Quickly mark subscribers as *Delivered*, *Not Delivered*, or *Paused*.
- **Duplicate Delivery Guard**: Prevents recording duplicate deliveries for the same customer on the same date.
- **Bulk Delivery**: One-click "Mark All Remaining as Delivered" for morning efficiency.

### 2. Monthly Billing Engine (`src/lib/billing-engine.ts`)
- **Formula**:
  $$\text{Current Charges} = \sum \text{Delivered Days} \times \text{Daily Rate (₹5.00)}$$
  $$\text{Total Due} = \text{Previous Balance} + \text{Current Charges} - \text{Advance Credit}$$
  $$\text{Remaining Amount} = \text{Total Due} - \text{Allocated Payments}$$
- **Dynamic Statuses**:
  - **Cleared (Green Tick)**: Remaining balance $\le ₹0$.
  - **Partial (Blue Badge)**: Paid amount $> ₹0$ and remaining amount $> ₹0$.
  - **Pending (Amber Badge)**: Paid amount $= ₹0$ and remaining amount $> ₹0$.
- **Carry-Forward Ledger**: Unpaid balances from prior months automatically roll forward into the current month's bill.

### 3. Payment Processing & FIFO Allocation (`/admin/payments`)
- **Cash & UPI Support**: Record physical cash handed to Admin or digital transfers with UPI/UTR reference.
- **Automatic FIFO Bill Allocation**: Payments automatically clear the oldest outstanding bills first.
- **Advance Credit Preservation**: Any excess payment beyond total dues is safely credited to the subscriber's advance balance.
- **Audited Reversals**: No silent deletions. Payment corrections require an audited reason, restore previous bill balances, and record an audit log.
- **Printable Receipts**: Instant digital receipts with unique numbers (e.g. `REC-202609-0001`).

### 4. Assisted Diary Migration (`/admin/import`)
- **CSV Import Tool**: Digitizes handwritten distribution diary records via a standardized CSV template.
- **Smart Validation**: Validates 10-digit phone numbers, required delivery addresses, and detects duplicate subscribers before importing.
- **Preview Table**: Visual confirmation step before committing to the database.

### 5. Multi-Role Portals & Security
- **Admin Portal (`/admin/*`)**: Full agency operations, billing, customer CRUD, payments, reports, and settings.
- **Delivery Staff Portal (`/delivery/*`)**: Mobile-first route checklist with **zero financial access** (no bills, rates, or payment details visible).
- **Customer Portal (`/customer/*`)**: Private subscriber self-service dashboard for viewing monthly bills, delivered days breakdown, and payment receipts.

---

## 📂 Project Structure

```
PaperTrack/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx        # Editorial newspaper login with 1-click test roles
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx       # Live KPIs, cash/UPI split, customer health cards
│   │   │   ├── customers/               # Customer directory, new subscriber, 360° profile, edit
│   │   │   ├── delivery/page.tsx        # Daily delivery management desk
│   │   │   ├── billing/                 # Monthly bill generation & printable itemized invoices
│   │   │   ├── payments/                # Cash/UPI ledger, payment entry & audited reversals
│   │   │   ├── delivery-boys/           # Delivery staff directory & route assignment
│   │   │   ├── import/page.tsx          # Assisted diary CSV import tool
│   │   │   ├── reports/page.tsx         # Revenue reports & outstanding balance ledger
│   │   │   └── settings/page.tsx        # Agency contact & daily rate preferences
│   │   ├── delivery/                    # Delivery boy mobile portal (checklist & routes)
│   │   ├── customer/                    # Subscriber self-service portal (bills & receipts)
│   │   ├── globals.css                  # Lokmat-inspired color tokens (#B91C1C, ink, soft gray)
│   │   └── layout.tsx                   # App root layout with AuthProvider
│   ├── components/
│   │   ├── layout/                      # AdminSidebar, AdminTopbar, DeliveryNav, CustomerNav
│   │   └── shared/                      # StatCard, StatusBadge, EmptyState
│   ├── lib/
│   │   ├── billing-engine.ts            # Pure calculation engine (billing, FIFO allocation, reversals)
│   │   ├── data-service.ts              # Unified data service supporting full CRUD and database sync
│   │   ├── auth-context.tsx             # Role-based auth provider with instant demo switches
│   │   ├── types.ts                     # TypeScript database and domain interfaces
│   │   ├── utils.ts                     # Currency (₹), date helpers & receipt number generator
│   │   └── export-csv.ts                # CSV generator for reports and bills
│   └── tests/
│       ├── billing-engine.test.ts       # 16 unit tests for delivered days, carry-forward, status
│       └── payment-allocation.test.ts   # Unit tests for multi-month FIFO allocation
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql       # Complete PostgreSQL DDL (14 tables, RLS policies, triggers)
│   └── seed.sql                         # Realistic test dataset (Admin, 2 Staff, 10 Customers, Bills)
├── .env.example                         # Environment variable template
└── package.json
```

---

## 🚀 Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Unit Tests
```bash
npm test
```
All 18 automated unit tests test daily charges calculations, carry-forward logic, multi-month FIFO payment allocation, advance credit calculation, and payment reversals.

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Role Credentials

For immediate pair-programming evaluation and testing, the `/login` page includes **1-Click Role Login** buttons:

| Role | Account Name | Email | Default Landing |
| :--- | :--- | :--- | :--- |
| **Admin** | Admin (Agency Owner) | `admin@papertrack.com` | `/admin/dashboard` |
| **Delivery Staff** | Ramesh Shinde | `ramesh@papertrack.com` | `/delivery/today` |
| **Customer** | Anand Kulkarni | `anand@papertrack.com` | `/customer/dashboard` |

You can also switch active roles at any time using the **View As** switcher in the top navigation bar.

---

## 🗄️ Supabase PostgreSQL Setup & Migration

### Step 1: Create Supabase Project
1. Create a project at [supabase.com](https://supabase.com).
2. Copy your Project URL and Anon Key into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 2: Apply Database Migrations
In the Supabase SQL Editor, run:
```sql
-- Execute contents of:
supabase/migrations/001_initial_schema.sql
```
This creates all 14 tables, foreign keys, indexes, triggers, and Row Level Security (RLS) policies.

### Step 3: Seed Sample Agency Data
In the Supabase SQL Editor, run:
```sql
-- Execute contents of:
supabase/seed.sql
```
This populates the database with 1 admin, 2 delivery staff, 10 realistic subscribers across two sectors, delivery records, generated bills, and payment records.

---

## 🛡️ Data Security & Authorization

- **Admin Role**: Full access across all tables, billing operations, settings, and subscriber accounts.
- **Delivery Staff Role**: Strictly isolated to assigned routes. RLS policies and UI hide all financial data, rates, and billing ledgers.
- **Customer Role**: Scoped via RLS to view only their own linked profile, monthly bills, and payment receipts.
