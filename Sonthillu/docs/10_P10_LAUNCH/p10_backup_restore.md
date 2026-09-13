# Database Backup & Restore Plan

This document outlines the backup and restore strategies for the Sonthillu Production MySQL Database.

## 1. Backup Strategy

- **Mechanism:** Utilize Hostinger's automated daily database backups. If not available natively on the selected plan, configure a cron job to run `mysqldump` and ship the encrypted archive to an offsite secure storage bucket.
- **Frequency:** Minimum daily backups (nightly).
- **Retention:** Keep daily backups for 7 days, weekly backups for 4 weeks, and monthly backups for 3 months.
- **Pre-Migration Backups:** **MANDATORY**. Before running `npx prisma migrate deploy` during any deployment, a manual on-demand snapshot MUST be taken.

## 2. Restore Procedure

1. **Identify the Target:** Locate the exact timestamped SQL dump required for restoration.
2. **Stop the Application:** Bring down the Next.js production process to prevent writes during restoration.
3. **Drop Existing Data:** Safely drop and recreate the database schema to avoid constraint conflicts (or use the drop tables command).
4. **Restore SQL Dump:**
   ```bash
   mysql -u [user] -p[password] [database_name] < backup_file.sql
   ```
5. **Verify:** Check database integrity and verify recent critical records (like `AdminSession`, `Customer`, `HeroSlide`).
6. **Restart Application:** Bring the Next.js process back online and run smoke tests.

## 3. Disaster Recovery

- In the event of a catastrophic server failure, a new Hostinger instance must be provisioned.
- The `DATABASE_URL` in `.env` must be updated to point to the newly restored database.
- DNS changes may be required if the database host dictates IP shifts.

---

**Warning:** Never test the restore procedure directly onto the production database. Always use a staging clone for validation.
