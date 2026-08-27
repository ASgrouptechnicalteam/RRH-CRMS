# 02 Site Visit Authorization

Based on the actual implementation in `apps/api/src/policies/siteVisit.policy.ts` and `apps/api/src/routes/siteVisits.ts`.

## Used Permissions
The system currently uses the following explicit permissions from `Permissions` enum:
- `SITE_VISITS_READ`: Required to call `GET /api/v1/site-visits`
- `SITE_VISITS_CREATE`: Required to call `POST /api/v1/site-visits`
- `SITE_VISITS_VERIFY`: Required to call `POST /api/v1/site-visits/:id/verify`
- `SITE_VISITS_ASSIGN_AGENT`: Required to call `POST /api/v1/site-visits/:id/assign-agent`
- `SITE_VISITS_COMPLETE`: Required to call `POST /api/v1/site-visits/:id/complete`

## API Routing Security
Every route enforces security using the `requirePermission` middleware.

## Policy Level Authorization
The `SiteVisitPolicy` performs the second level of authorization (Data Scope):
- Identifies if the user is Management (`MD`, `ADMIN`, `HR_MANAGER`, `MARKETING_DIRECTOR`, `PROJECT_MANAGER`).
- Filters `canList` logic based on this determination (restricting regular employees to their specific IDs).
- Enforces strict tenant isolation by checking `company_id`.
