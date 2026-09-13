# Admin Portal — Credentials & Reference

## Login

- **URL:** `http://localhost:3000/admin/login`
- **Email:** `admin@sonthillu.com`
- **Password:** `ChangeMeImmediately123` (stored in `.env` as `ADMIN_SEED_PASSWORD` — gitignored)
- **Role:** `SUPER_ADMIN` (id=51)
- **Permissions:** All (admin:manage, analytics:read, content:write, audit:read, system:read)

## Role Hierarchy

| Role            | Rank | Permissions                                |
| --------------- | ---- | ------------------------------------------ |
| ANALYST         | 1    | analytics:read                             |
| CONTENT_MANAGER | 2    | analytics:read, content:write              |
| ADMIN           | 3    | analytics:read, content:write, system:read |
| SUPER_ADMIN     | 4    | All permissions                            |

## Available Pages & Controls

### Overview — `/admin/overview`

**Permission:** analytics:read

8 metric cards:

- Enquiries
- Callback Requests
- Searches
- Property Views
- Shortlist Adds
- Compares
- AI Searches
- Rec Clicks (with CTR %)

2 data displays:

- Top Locations Searched (top 5)
- Top Property Types (top 5)

Time window: 30d default (configurable via `getOverviewMetrics(window)`)

---

### Leads — `/admin/leads`

**Permission:** analytics:read

5 metric cards:

- Total Leads
- Property Enquiries
- Callback Requests
- Consultations
- Seller Appraisals

visualizations:

- Lead volume bar chart (last 30 days, daily breakdown)

⚠️ **CRM DEPENDENCY:** Lead qualification, disposition, and callback outcome are managed in the CRM (`rs-crms.onrender.com`). This page shows website-originated activity only.

---

### Searches — `/admin/searches`

**Permission:** analytics:read

3 metric cards:

- Total Searches
- Zero-Result Searches (with rate %)
- Most Popular Location

4 data tables:

- Top Locations
- Top Property Types
- Top BHK Configurations
- Top Budget Bands

Zero-Result Demand table:

- Location, Type, BHK, Budget, Missed Searches count
- Use to identify inventory gaps

---

### AI Search — `/admin/ai-search`

**Permission:** analytics:read

8 metric cards:

- Total AI Queries
- Interpretation Success %
- Clarification Rate %
- Zero-Result Rate %
- Result Clicks
- AI Shortlists
- AI Compares
- AI Enquiries

Additional:

- Unsupported Intents counter (queries rejected as out-of-domain)
- 3 intent breakdown tables: Top Locations, Top Property Types, Top BHK

---

### Properties & Projects — `/admin/properties`

**Permission:** analytics:read

5 metric cards:

- Property Views
- Project Views
- Shortlists
- Compares
- Enquiries

2 data tables:

- Top Viewed Properties (by CRM Property ID)
- Top Viewed Projects (by CRM Project ID)

⚠️ **CRM DEPENDENCY:** Property and project metadata (names, locations) are fetched from the CRM. If CRM is unavailable, only IDs are shown.

---

### Recommendations — `/admin/recommendations`

**Permission:** analytics:read

6 metric cards:

- Impressions
- Clicks
- Global CTR
- Rec Property Views
- Rec Shortlists
- Rec Enquiries

Data table:

- Performance by Recommendation Group (group type, impressions, clicks, CTR %)

---

### Customers — `/admin/customers`

**Permission:** analytics:read

4 metric cards:

- Active Customers
- Total Sessions
- Searches / User
- Enquiry Conversion Rate

Seller Funnel Status breakdown:

- None
- Pending Verification
- Verified
- Suspended

PII Data Access section:

- ADMIN/SUPER_ADMIN: "Search Customers" button (individual profile access)
- Lower roles: Access restricted message

---

### Hero CMS — `/admin/content/hero`

**Permission:** content:write

Slide manager controls:

- Create new slide
- Edit existing slide
- Reorder slides (display order)
- Archive/unarchive slides
- Each slide fields: image URL, headline, subtext, CTA label, CTA link, active toggle, display order

Fetches ALL slides (including inactive) for management.

---

### System & Security — `/admin/system`

**Permission:** system:read

3 metric cards:

- Current Role
- Environment (NODE_ENV)
- Next Auth Secret status (Configured/Missing)

Audit Log table:

- Columns: Time, Admin ID, Action, Summary
- SUPER_ADMIN: sees all system-wide logs
- Other roles: see only their own actions
- Limit: 50 most recent

---

## Security Implementation

- **Separate sessions:** Admin sessions are completely isolated from customer sessions. Never reuse customer auth.
- **Password hashing:** bcryptjs with cost factor 12
- **Session tokens:** 32-byte CSPRNG → hex string → SHA-256 hash stored in DB
- **Session cookie:** `sonthillu_admin_session` — HTTP-only, secure in production
- **Session TTL:** Configurable via `ADMIN_SESSION_TTL_MS` in `src/lib/admin/brand.ts`
- **Revocation:** Individual session or all sessions for an admin
- **Inactive accounts:** Blocked from login
- **Audit logging:** Every admin action logged to `admin_audit_logs` table with timestamp, admin ID, action name, target, summary, and optional metadata
- **Role-based access:** Each page calls `requireAdminPermission(permission)` at the top. Unauthorized access throws `AdminForbiddenError`.

## Local vs Production

- These credentials are for **LOCAL DEVELOPMENT ONLY**
- `.env` is gitignored — the password is not in version control
- For production deployment:
  1. Set different `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in production `.env`
  2. Run `npx tsx prisma/seed-admin.ts` on the production database
  3. Never reuse local dev credentials in production

## Creating Additional Admin Users

Currently there is no UI for creating admin users — the seed script is the only mechanism. To add more admins:

1. Add temp env vars: `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `ADMIN_SEED_NAME`
2. Run `npx tsx prisma/seed-admin.ts` — it creates a SUPER_ADMIN if the email doesn't exist
3. Remove the env vars after

Future enhancement: Build an admin user management UI (SUPER_ADMIN only) for creating/managing admin accounts with role assignment.

## Database Schema

```
Admin          — id, email, passwordHash, name, role, active, createdAt, updatedAt, lastLoginAt
AdminSession   — id, adminId, sessionTokenHash, expiresAt, createdAt, lastSeenAt, revokedAt, userAgent
AdminAuditLog  — id, adminId, action, target, targetId, summary, metadata, occurredAt
```
