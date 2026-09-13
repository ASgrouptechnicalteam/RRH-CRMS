# Hostinger Infrastructure Requirements

This document outlines the required production infrastructure on Hostinger to support the Sonthillu V1 Next.js App Router application.

## 1. Hosting Environment

| Requirement         | Status     | Description                                                                                                                         |
| :------------------ | :--------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Plan Type**       | UNVERIFIED | Requires VPS or a plan that supports Node.js/Next.js custom server (shared hosting is usually insufficient for Next.js App Router). |
| **Node.js**         | UNVERIFIED | Node.js v18.17+ required (v20+ recommended).                                                                                        |
| **Process Manager** | UNVERIFIED | PM2 or Hostinger Node.js application runtime to keep `npm run start` alive.                                                         |
| **Memory / CPU**    | UNVERIFIED | Minimum 1GB RAM recommended, 2GB+ ideal for Next.js Server Components.                                                              |

## 2. Database (MySQL)

| Requirement           | Status     | Description                                                                                  |
| :-------------------- | :--------- | :------------------------------------------------------------------------------------------- |
| **MySQL Server**      | UNVERIFIED | Dedicated production MySQL database (v8.0+ recommended).                                     |
| **Connection Limits** | UNVERIFIED | Prisma requires sufficient connection limits; consider setting up Prisma connection pooling. |

## 3. Caching & Sessions (Redis)

| Requirement      | Status     | Description                                                                                             |
| :--------------- | :--------- | :------------------------------------------------------------------------------------------------------ |
| **Redis Server** | UNVERIFIED | Used for critical rate limiting and idempotency controls. Must not fallback to in-memory in production. |

## 4. Network & Security

| Requirement               | Status     | Description                                                                                         |
| :------------------------ | :--------- | :-------------------------------------------------------------------------------------------------- |
| **Domain**                | UNVERIFIED | Primary domain configuration (e.g., sonthillu.com).                                                 |
| **SSL / HTTPS**           | UNVERIFIED | Valid SSL certificate required for secure cookies (`sonthillu_session`, `sonthillu_admin_session`). |
| **Environment Variables** | UNVERIFIED | Secure configuration for production secrets (.env).                                                 |

## 5. Storage

| Requirement             | Status     | Description                                                                                                                |
| :---------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Media/Image Storage** | UNVERIFIED | If Hero CMS images are uploaded, writable persistent storage or external object storage (e.g., S3/Cloudinary) is required. |
| **Backups**             | UNVERIFIED | Automated database backup capability.                                                                                      |

---

**Note:** Deployment cannot proceed until the `UNVERIFIED` items above are confirmed for the target Hostinger environment.
