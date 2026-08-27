# RRH-CRMS Test Baseline

## Overview
This document covers the test automation baseline for the repository.

## Frameworks
- **Backend**: Jest (`jest`, `ts-jest`, `supertest`)
- **Frontend**: E2E testing framework configuration detected (`playwright.config.ts`), though mostly backend tests are confirmed active.

## Execution Environment
- Environment Variables: Controlled via `.env.test` 
- Isolation: The database is strictly separated from production data during test execution. 
- Execution: `npm run test:api` or `npx jest`

## Current Baseline Status
Based on the most recent verified run:
- **Total Test Suites**: 13
- **Total Tests**: 100
- **Status**: 100 Passed, 0 Failed
- **Key Modules Tested**:
  - `phase8.test.ts`: Verifies LeadPropertyInterest and tenant isolation.
  - `siteVisits.test.ts`: Validates workflow engine transitions (e.g., 409 Conflict for out-of-order state transitions, 403 Forbidden for cross-company data access).
  - `workflowEngine.test.ts`: Validates deterministic state machine.
  - `auth.test.ts`: Asserts JWT logic.

## Safety Mechanisms
- Code relies on `globalSetup` / `globalTeardown` inside Jest to prevent destructive database actions on non-test environments.
- Active cross-company validations exist inside test assertions to prove tenant isolation continuously.
