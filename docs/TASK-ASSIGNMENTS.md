# RRH-CRMS — Task Assignment Tracker

Update this file yourself each time you start or finish a session — it's the only place tracking which agent owns what right now, since I (Claude) can't see your local machine state between conversations. Keep it committed to git alongside every other change (`git add docs/TASK-ASSIGNMENTS.md && git commit -m "chore: update task tracker"`).

**Rule:** only one row may be "in progress" per file/folder scope at a time. `packages/shared` in particular — check this table before starting any session that touches it.

| Task | Agent | Branch | Scope (folders touched) | Status |
|---|---|---|---|---|
| Phase 0 — Docs archive | Antigravity | `agent/antigravity/phase0-docs` | `docs/`, root `*.md` | not started |
| Phase 1 — Temp/log cleanup | Antigravity | `agent/antigravity/phase1-cleanup` | repo root, `_hygiene_archive/` | not started |
| Phase 2 — Navy theme | Antigravity | `agent/antigravity/phase2-theme` | `apps/web/src`, `tailwind.config.js` | not started |
| Phase 3 — Build error fixes | Antigravity | `agent/antigravity/phase3-build` | `apps/web/src`, `apps/api/src` (non-shared) | not started |
| Phase 3 — Shared type corrections | **Hermes** | `agent/hermes/phase3-shared-types` | `packages/shared/src` | not started |
| Phase 3 — Prisma singleton + test fixes | **Hermes** | `agent/hermes/phase3-tests` | `apps/api/src`, `tests/` | not started |
| Phase 3 — Hygiene items (console.log, secrets, `.env`) | Antigravity | `agent/antigravity/phase3-hygiene` | `apps/api/src`, `apps/web/src` | not started |
| Phase 4 — Security & data-leak audit | **Hermes** | `agent/hermes/phase4-security` | `apps/api/src/routes`, `services`, `policies` | not started |
| Phase 5 — Schema + workflow engine | **Hermes** | `agent/hermes/phase5-schema` | `prisma/`, `apps/api/src/workflows` | not started |
| Phase 5 — Backend service rewiring | **Hermes** | `agent/hermes/phase5-services` | `apps/api/src/services`, `routes` | not started |
| Phase 5 — Frontend action-button wiring | Antigravity | `agent/antigravity/phase5-frontend` | `apps/web/src/components/leads` | not started |
| UI/UX Phase A — Design tokens + components | Antigravity | `agent/antigravity/uiux-phaseA` | `apps/web/src/components/ui`, `tailwind.config.js` | not started |
| UI/UX Phase B — Sidebar polish | Antigravity | `agent/antigravity/uiux-phaseB` | `AppLayout.tsx` | not started |
| UI/UX Phase C — Dashboards (×7) | Antigravity | `agent/antigravity/uiux-phaseC-<name>` | `apps/web/src/components/dashboards` | not started |
| UI/UX Phase D — Workflow screens | TBD (after Phase 5 merged) | — | `apps/web/src/components/leads`, `sales`, `properties` | blocked on Phase 5 |

**Status values to use:** `not started` / `in progress` / `ready for review` / `merged` / `blocked on <reason>`.

**Before starting any session:**
1. Check this table — is anything else currently `in progress` on an overlapping folder scope?
2. `git checkout main && git pull`
3. `git checkout -b <branch from table>`
4. Update this row to `in progress`.

**After finishing any session:**
1. Confirm the agent committed (per the non-negotiable rule in `UI-UX-MASTER-PLAN.md` §6 and the equivalent expectation across `IMPLEMENTATION-ROADMAP.md`) — if not, commit yourself.
2. Merge to `main` once verified, delete the branch.
3. Update this row to `merged`.
