# Production Deployment Runbook

This document details the step-by-step safe deployment strategy for Sonthillu V1 to the Hostinger environment.

## Phase 1: Environment Setup

1. **Provision Infrastructure**: Ensure Hostinger Node.js plan is active, and MySQL/Redis databases are created.
2. **Configure Environment Variables**: Based on `.env.production.example`, securely inject secrets into the Hostinger environment manager.
   - _Never place secrets under `NEXT_PUBLIC_*`._
3. **Verify Domain & SSL**: Ensure `sonthillu.com` is mapped and SSL certificate is fully provisioned.

## Phase 2: Database Preparation

1. **Connect to MySQL**: Ensure the connection string works.
2. **Backup**: If this is a subsequent deployment, take a full snapshot backup before migrating.
3. **Migrate**: Run Prisma migrations safely.
   ```bash
   npx prisma migrate deploy
   ```
   _(Do NOT run `prisma migrate reset` or `prisma db push` on production)_

## Phase 3: Application Build

1. Build the application using the exact production environment.
   ```bash
   NODE_OPTIONS="--max-old-space-size=8192" npm run build
   ```
   _(Ensure all production variables are present during build so static generation completes successfully)_

## Phase 4: Application Start & Process Management

1. Start the application via Hostinger's Node runtime manager or PM2.
   ```bash
   npm run start
   ```
2. Verify process stays alive and does not enter a crash loop.

## Phase 5: Verification & Health Check

1. **Health Check**: Ping the health endpoint (if configured) or verify the homepage loads securely over HTTPS.
2. **Smoke Tests**: Check critical routes (Search, Auth, Leads, Admin).
3. **Admin Bootstrap**: Log into the admin portal using the `ADMIN_SEED_EMAIL`. Verify the session persists. **Rotate the seed credentials immediately** and create authorized user accounts.

## `.env.production.example` Template

```env
# APP
NODE_ENV="production"
NEXT_PUBLIC_SITE_URL="https://www.sonthillu.com"

# DATABASE
DATABASE_URL="mysql://user:password@host:3306/db_name"

# REDIS
REDIS_URL="redis://:password@host:port"

# SECURITY
AUTH_SESSION_SECRET="generate_a_strong_random_secret"
ADMIN_SEED_EMAIL="super@sonthillu.com"
ADMIN_SEED_PASSWORD="strong_initial_password"

# CRM
CRM_API_BASE_URL="https://api.sonthillucrm.com"
CRM_API_KEY="production_api_key_here"

# AI (Optional)
AI_PROVIDER="gemini"
AI_API_KEY="ai_api_key_here"
AI_MODEL="gemini-1.5-pro"

# EMAIL
EMAIL_PROVIDER="resend"
EMAIL_PROVIDER_API_KEY="email_api_key"
EMAIL_FROM="noreply@sonthillu.com"
```
