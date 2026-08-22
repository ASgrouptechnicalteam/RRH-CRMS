# RRH-CRMS CODE HYGIENE & ORGANIZATION AUDIT

## 1. Executive Summary
This read-only audit evaluates the current hygiene, organization, and technical debt of the RRH-CRMS repository following a series of major UI and RBAC overhauls. The codebase is functionally stable and successfully builds, but currently contains architectural duplication, oversized "God Components", and unused legacy pages that require strict cleanup sequencing to ensure business continuity.

## 2. Repository Baseline
- **Build Status**: Passing (`tsc --noEmit` 0 errors, `vite build` 24.28s).
- **Core Stacks**: React/TypeScript, Vite, TailwindCSS, Prisma.
- **Architectural Pattern**: Modular feature hubs (LeadManagement, HRDashboard) interacting with shared contexts (`AuthContext`).

## 3. Working Tree Protection Baseline
Current `git status`:
- **Branch**: `main` (Ahead of `origin/main` by 1 commit).
- **Changes**: 44 files changed, 1949 insertions(+), 600 deletions(-).
- **Protected Packets**: `UI-11` through `UI-15F` are active in the working tree and must not be reverted or overridden during cleanup.

## 4. Unused Imports
- `apps/web/src/App.tsx`: Numerous unused alias imports and legacy layout wrappers that were superseded by `AppLayout.tsx`.
- `apps/web/src/components/leads/LeadManagement.tsx`: Likely unused specific SVG icons (e.g., `ChevronLeft`, `ChevronRight`) as pagination relies on broader components.
*(Confidence: 90% VERY LIKELY)*

## 5. Unused Symbols
- Local interface definitions in `LeadManagement.tsx` (e.g. `FilterState` or duplicate `Lead`) which have since been mapped directly to API responses or global schemas.
*(Confidence: 80% UNCERTAIN)*

## 6. Dead Components
- `LeadsClientsPage.tsx`:
  - **file**: `apps/web/src/pages/LeadsClientsPage.tsx`
  - **references**: 0 imports, no route, no test reference.
  - **reason**: Superseded by `LeadManagement.tsx` and `CustomerManagement.tsx` directly in `App.tsx`.
  - **confidence**: 100% PROVEN DEAD
  - **risk**: Minimal to None.

- `WelcomeGuide.tsx`:
  - **file**: `apps/web/src/components/onboarding/WelcomeGuide.tsx`
  - **references**: Unreferenced outside its own file.
  - **reason**: Legacy onboarding modal.
  - **confidence**: 95% VERY LIKELY
  - **risk**: Low.

## 7. Dead Routes
- `/leads-clients`:
  - **route**: `<Route path="/leads-clients" element={<LeadManagement />} />`
  - **reason**: Duplicates `/leads`.
  - **safe to remove?**: Yes, assuming users haven't bookmarked the legacy route. 
  - **risk**: Low.

## 8. Duplicate Logic
- **API Fetch Wrappers**: Nearly every major component (`FinanceHub.tsx`, `LeadManagement.tsx`, `PropertyManagement.tsx`) independently implements its own `try/catch` block wrapping `fetchWithAuth`, rather than using a centralized data-fetching hook like React Query.
- **Table Patterns**: HTML `<table>` rendering logic, pagination state, and empty-state components are duplicated across 8+ major domains.

## 9. Role/Permission Duplication
- **Raw Role Strings**:
  - `PropertyManagement.tsx` checks: `const isPM = user?.roles?.some((r) => ([Roles.PROJECT_MANAGER, Roles.MD, Roles.ADMIN] as readonly string[]).includes(r));`
  - `EmployeeManagement.tsx` checks: `const isMDAdmin = user?.roles?.some(r => [Roles.MD, Roles.ADMIN].includes(r));`
  - **Flag**: UI components frequently reimplement complex role unions instead of relying solely on `user.permissions.includes()` which is the canonical RBAC method defined in `packages/shared`.

## 10. Status/Enum Duplication
- **Status Strings**: `PENDING_VERIFICATION`, `PENDING_DM_POLISH`, `PENDING_MD_APPROVAL`.
  - **Duplicate**: Hardcoded in `PropertyManagement.tsx` switch statements, table badges, and Prisma schemas.
  - **Classification**: Legacy/Duplicate. These should be extracted to `packages/shared/src/index.ts` as standard Zod enums.

## 11. Legacy Code
- `LeadsClientsPage.tsx`:
  - **Why legacy?**: Replaced by dedicated `LeadManagement.tsx` embedded in `AppLayout`.
  - **Still referenced?**: No.
  - **Safe to remove?**: Yes.

## 12. Large Files
- **`LeadManagement.tsx`** (~72.4 KB): Handles API fetching, Table rendering, Pagination, Dossier Tabs, Inline mutations, and complex form modals. *Recommend splitting into `/leads/table`, `/leads/dossier`, `/leads/hooks`.*
- **`AddPropertyWizard.tsx`** (~50.2 KB): Massive multi-step form wizard. *Recommend splitting form steps into smaller components.*
- **`EmployeeManagement.tsx`** (~34.1 KB) and **`PropertyManagement.tsx`** (~33.6 KB): Both suffer from "God Component" syndrome.

## 13. Responsibility Violations
- **`CustomerManagement.tsx` & `LeadManagement.tsx`**: Mix presentation, data fetching, global `Toast` management, and complex business logic (e.g. status transition validation).
- **Recommendation**: Extract generic hooks (`useLeads()`, `useProperties()`) and pull modal management to context or separate sibling components.

## 14. Asset Audit
- Local placeholder images, SVGs, or old logos from earlier prototyping phases likely reside in `public/`. 
- **Action**: Do not delete until a comprehensive asset tree mapping is complete.

## 15. Test Coupling
- Files in `tests/api/` (e.g., `properties.test.ts`) are highly coupled to backend JSON structures. Dead frontend components (`LeadsClientsPage.tsx`) have zero test coupling, making them safe to drop.

## 16. Comment Audit
- **GOOD**: `// Permanent 2-Letter Department Codes for Employee IDs` in `shared/index.ts`.
- **BAD**: `// 20 Industrial Form Fields State` (recently corrected to "Employment") narrating obvious React `useState` hooks.
- **Action**: Remove obvious architectural narration inside components; move to domain READMEs.

## 17. Documentation Drift
- Historical documentation (e.g. `RRH-CRMS-RECONSTRUCTION-AUDIT.md`) frequently mentions older routes and structures that have since been heavily optimized in UI-15 (e.g., AppLayout unification).
- **Classification**: Historical.

## 18. Security-Protected Code
- **DO NOT TOUCH**:
  - `packages/shared/src/index.ts` (Permissions Matrix)
  - `apps/web/src/context/AuthContext.tsx`
  - `apps/api/src/routes/auth.routes.ts`
  - `apps/api/src/middlewares/auth.middleware.ts`
  - JWT lifecycle and cookie configurations.

## 19. Recommended Repository Organization
```
apps/web/src/
  ├── components/
  │   ├── ui/          (Shared generic components: Button, Modal, Table)
  │   └── features/    (Domain logic)
  │       ├── leads/   (Contains hooks, utils, and specific components)
  │       ├── properties/
  │       └── hr/
  ├── hooks/           (Global hooks: useAuth, useToast)
  ├── lib/             (API clients, fetch wrappers)
  └── pages/           (Thin route wrappers combining features)
```

## 20. Safe Cleanup Candidates
- `apps/web/src/pages/LeadsClientsPage.tsx` (100% PROVEN DEAD)
- `apps/web/src/components/onboarding/WelcomeGuide.tsx` (95% VERY LIKELY)
- Route `/leads-clients` in `App.tsx` (95% VERY LIKELY)

## 21. Refactor Candidates
- **P2**: Consolidate `user?.roles?.some(...)` checks into global capability flags.
- **P2**: Extract HTML `<table>` rendering in `LeadManagement.tsx` into a reusable `<DataTable />` component.
- **P2**: Break down `AddPropertyWizard.tsx` into `Step1.tsx`, `Step2.tsx`, etc.

## 22. Do-Not-Touch List
- Anything related to `AuthContext`, `Permissions`, `Roles`.
- The physical QR generation and verification paths (`EmployeeQrCode`).
- The property verification state machine strings until officially centralized.

## 23. Proposed Cleanup Sequence
1. **P1 (Safe Cleanup)**: Delete `LeadsClientsPage.tsx` and dead routes.
2. **P2 (Organization)**: Create `features/` directory architecture.
3. **P3 (Refactoring)**: Split `LeadManagement.tsx` and `AddPropertyWizard.tsx`.
4. **P4 (Centralization)**: Move all raw strings (e.g., `PENDING_VERIFICATION`) to `packages/shared`.

## 24. Risk Register
- **Risk**: Deleting legacy aliases like `/leads-clients` breaks user bookmarks. (Low impact, easily fixed with a 301 redirect wrapper).
- **Risk**: Refactoring `PropertyManagement.tsx` state risks breaking the tightly coupled dossier verification step. (High impact, requires heavy manual QA).

## 25. Validation Results
- `npx tsc --noEmit`: 0 errors.
- `npx vite build`: Successfully compiled for production in 24.28s.
- `git status`: Main branch, 1 commit ahead, 44 working tree modifications protected.

## 26. Final Verdict
🟡 **CLEANUP READY WITH REVIEW**
*(The repository is clean enough to identify dead code accurately, but the presence of large God Components requires careful, staggered PRs for refactoring to avoid breaking business logic.)*
