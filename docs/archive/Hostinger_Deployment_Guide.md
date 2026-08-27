# Hostinger Production Deployment Guide — Radha Real Homes & Sonthillu EMS/CRM

---

## 1. Pre-Deployment Audit Verification Checklist

Before deploying, all audit items have been verified and passed:

| Checklist Item | Status | Verification Detail |
|---|---|---|
| **TypeScript & Build** | ✅ PASS | Vite production bundle compiles cleanly with zero TypeScript errors. |
| **Performance & Code Splitting** | ✅ PASS | `React.lazy` + `Suspense` dynamic code splitting implemented for all heavy workstation modules (`Leads`, `Properties`, `CP`, `SiteVisits`, `Employees`, `MDControl`). |
| **Security & RBAC** | ✅ PASS | RBAC middleware (`requireRole`), JWT authentication, parameterization via Prisma (anti-SQL Injection), and XSS escaping active across all endpoints. |
| **PWA & Offline Caching** | ✅ PASS | `manifest.json` and PWA Service Worker (`sw.js`) registered in `main.tsx` for standalone home screen installation & offline caching. |
| **Error Handling & Forms** | ✅ PASS | Inputs validated, duplicate submission prevented via `disabled={isSubmitting}`, field-level validation and error/success toasts implemented. |
| **Database Connectivity** | ✅ PASS | Single Source of Truth Hostinger Cloud MySQL Database (`82.25.121.145:3306`) tested and synced. |

---

## 2. Frontend Web App Deployment (Hostinger Static Web Hosting)

### Step 1: Build Production Bundle
In your local workspace terminal, run:
```bash
npm run build --workspace=apps/web
```
This generates the optimized production bundle inside **`apps/web/dist/`**.

### Step 2: Upload Dist Files to Hostinger `public_html`
1. Log into your **Hostinger hPanel** (`hpanel.hostinger.com`).
2. Navigate to **Websites** $\rightarrow$ **File Manager**.
3. Open the **`public_html`** folder for your domain (e.g. `rrh.radharealhomes.com`).
4. Upload all files and subfolders inside **`apps/web/dist/`** directly into `public_html/`.

### Step 3: Configure SPA Routing (`.htaccess`)
To prevent `404 Not Found` errors when refreshing sub-routes on React PWA, create or edit the **`.htaccess`** file inside `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 3. Backend Node.js API Deployment (Hostinger Node.js App / VPS)

### Step 1: Build Backend Production Code
```bash
npm run build --workspace=apps/api
```

### Step 2: Configure Environment Variables in Hostinger hPanel
Under Hostinger Node.js Application settings, set the environment variables:
```env
PORT=3000
NODE_ENV=production
DATABASE_URL="mysql://u988844918_crms:Hostinger%402026@82.25.121.145:3306/u988844918_crms"
JWT_SECRET="RRH_SONTHILLU_ENTERPRISE_JWT_SECRET_2026_PROD"
APP_URL="https://your-domain.com"
```

### Step 3: Start Node.js API via PM2 / Hostinger Node Runner
```bash
npx prisma db push
npx pm2 start apps/api/dist/server.js --name "rrh-api"
```

---

## 4. Post-Deployment Verification

1. Visit your live domain (e.g. `https://your-domain.com`).
2. Verify SSL certificate HTTPS connection.
3. Test PWA Installation prompt popup.
4. Log in as **MD** (`RRH-EX-001` / `Password@123`) to verify executive command center metrics.
