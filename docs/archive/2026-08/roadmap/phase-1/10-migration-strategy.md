# RRH-CRMS Migration Strategy

## Overview
This document outlines the proposed strategy to migrate the current schema to the target schema without causing data loss or breaking existing integrations.

## 1. Goal
Transition from `Lead`-centric models to `Customer` -> `Opportunity` models, and `Property` to `Project` -> `Unit` models.

## 2. Approach: Additive Incremental Migration
Do NOT drop or drastically alter the `Lead` or `Property` tables in a single giant commit.

### Step 1: Schema Addition (Phase 2/3/4)
- Add the `Customer` and `Opportunity` models to Prisma.
- Make them optional for existing relations where possible.
- Create mapping scripts that can eventually run to promote existing `Lead` records into `Customer` + `Opportunity` pairs.

### Step 2: Parallel Write (Phase 3/4)
- When a new `Lead` is created, it functions as usual.
- When a `Lead` is marked as `WON` or `NEGOTIATION`, the backend automatically generates the corresponding `Customer` and `Opportunity` records behind the scenes.

### Step 3: Read Switch (Phase 4/8)
- Update frontend UI components to read from `/opportunities` instead of filtering `/leads` for active deals.
- Deprecate the deal-oriented fields on `Lead` (budget, location preference) by moving UI reliance to `Opportunity`.

### Step 4: Schema Cleanup (Phase 20)
- Once all UI components use the new tables, old deal-specific columns on `Lead` can be dropped, returning `Lead` to its pure marketing-prospect purpose.

## 3. Backward Compatibility
- Existing API endpoints (e.g., `/api/v1/leads`) must maintain their current JSON response contracts as long as the old frontend components rely on them.
- Any new requirements for `Booking` or `Payment` will rely strictly on the new `Opportunity` / `Unit` models.
