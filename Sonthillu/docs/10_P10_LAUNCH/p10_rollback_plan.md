# Production Rollback Plan

This document outlines the procedure to safely revert Sonthillu to a previous stable state if a production deployment fails or causes critical errors.

## 1. Rollback Criteria

A rollback MUST be initiated if:

- The Next.js application enters a crash loop (`502 Bad Gateway` from reverse proxy).
- Core critical paths (Property Search, Lead Submission, Authentication) are broken in production.
- Database migrations cause data corruption or massive degradation.
- A critical security vulnerability is accidentally deployed.

## 2. Rollback Procedure

### Step A: Identify the Previous Build

Ensure you know the exact Git commit hash or build artifact of the previously running version.

### Step B: Assess Migration Compatibility

1. **Backward Compatible Migrations:** If the database migration was purely additive (e.g., adding a nullable column), you can safely rollback the application code **without** rolling back the database.
2. **Breaking Migrations:** If columns were dropped or renamed, you MUST restore the database from the pre-deployment backup (see `p10_backup_restore.md`).

### Step C: Execute Rollback

1. Stop the currently running Node process.
2. Restore the previous application build (via Git checkout or Hostinger artifact deployment).
3. (If necessary) Restore the database from the snapshot.
4. Rebuild the application if relying on Git checkout:
   ```bash
   NODE_OPTIONS="--max-old-space-size=8192" npm run build
   ```
5. Restart the Node process.

### Step D: Verification

1. Run smoke tests (Homepage, Search, Login) immediately.
2. Verify the `sonthillu_session` and `sonthillu_admin_session` cookies are still functioning for existing users, provided the `AUTH_SESSION_SECRET` was not changed during the failed deployment.

## 3. Session & Cache Implications

- If a rollback restores an older database state, any users who registered _after_ the backup but _before_ the rollback will lose their accounts and need to re-register.
- If the `AUTH_SESSION_SECRET` changed during the bad deployment, rolling back will invalidate ALL active sessions, requiring customers and admins to log in again.
