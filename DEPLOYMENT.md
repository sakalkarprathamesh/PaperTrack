# PaperTrack Production Deployment Guide

This guide describes how to deploy PaperTrack to production on **Vercel** with **Supabase PostgreSQL**.

---

## 1. Prerequisites

- Node.js 18.x or 20.x
- Active Supabase project with existing PaperTrack schema
- Vercel account linked to GitHub (`https://github.com/sakalkarprathamesh/PaperTrack.git`)

---

## 2. Production Environment Variables

Configure the following environment variables in your Vercel Project Settings (`Settings -> Environment Variables`):

| Variable Name | Environment | Required | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | Yes | The URL of your Supabase project (e.g. `https://xyzcompany.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | Yes | Supabase public anonymous API key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Secret) | Yes | Secret service-role key for backend API operations (never expose to client) |
| `NEXT_PUBLIC_ENABLE_DEMO_SWITCHER` | Production | No | Set to `false` in production so the demo role switcher is disabled |
| `NEXT_PUBLIC_APP_URL` | Production | Yes | The canonical URL of your deployment (e.g. `https://papertrack.lokmat.agency`) |

> [!WARNING]
> Never commit `SUPABASE_SERVICE_ROLE_KEY` to GitHub or expose it via any `NEXT_PUBLIC_` variable name.

---

## 3. Database Safety Rules

Your Supabase database contains live customer records, historical bills, and payment ledgers.

**Strict Database Rules:**
1. **DO NOT** run complete initial migrations again.
2. **DO NOT** execute `DROP TABLE` or `DROP SCHEMA`.
3. **DO NOT** reset Supabase via CLI (`supabase db reset`).
4. Any future schema additions must be created as safe incremental migrations (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).

---

## 4. Deploying to Vercel

### Step 1: Push latest code to GitHub
```bash
git add .
git commit -m "feat(prod): Phase 6 production security, deployment & i18n"
git push origin main
```

### Step 2: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... -> Project**.
3. Select the repository `sakalkarprathamesh/PaperTrack`.
4. Framework Preset will automatically detect **Next.js**.

### Step 3: Configure Environment Variables
In the Vercel deployment wizard, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ENABLE_DEMO_SWITCHER` = `false`
- `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`

### Step 4: Build & Deploy
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Click **Deploy**.

---

## 5. Alternative: Self-Hosted Node Server

To run PaperTrack on an Ubuntu or Debian VPS:

```bash
# Clone the repository
git clone https://github.com/sakalkarprathamesh/PaperTrack.git
cd PaperTrack

# Install production dependencies
npm ci

# Configure production environment
cp .env.example .env.production
nano .env.production

# Build the Next.js production bundle
npm run build

# Run using PM2
npm install -g pm2
pm2 start npm --name "papertrack" -- start -- -p 3000
pm2 save
pm2 startup
```

---

## 6. Post-Deployment Verification

After deployment completes:
1. Visit the production URL. Verify redirect behavior (unauthenticated traffic should go to `/login`).
2. Log in as **Admin**.
3. Verify that the **View As** role switcher is hidden in production.
4. Test the **Language Switcher** dropdown in the top bar: toggle between English, मराठी, and हिन्दी.
5. Verify that `/robots.txt` disallows private route indexing.
6. Verify file upload limit in `/admin/import` (rejects files > 5MB).
