# RRH-CRMS Workflow Boundaries

## Overview
This document defines the conceptual state machines for the target real estate lifecycle.

## 1. Lead Lifecycle
- **States**: `NEW` -> `ASSIGNED` -> `CONTACTED` -> `QUALIFIED` | `DISQUALIFIED`
- **Transitions**: 
  - `QUALIFIED`: Triggered when genuine interest is confirmed. Creates `Customer` + `Opportunity`.
  - `DISQUALIFIED`: Requires a reason (e.g., junk lead, zero budget).

## 2. Customer Lifecycle
- **States**: `PROSPECT` -> `ACTIVE_BUYER` -> `OWNER`
- **Transitions**: Driven implicitly by the status of their underlying Opportunities and Bookings.

## 3. Opportunity Lifecycle
- **States**: `OPEN` -> `SITE_VISIT_SCHEDULED` -> `NEGOTIATION` -> `WON` | `LOST`
- **Transitions**: 
  - `WON`: Triggered exclusively by the successful creation of a `Booking`.
  - `LOST`: Can be triggered by the Agent at any time with a mandatory reason.

## 4. Booking Lifecycle
- **States**: `DRAFT` -> `PENDING_APPROVAL` -> `CONFIRMED` -> `CANCELLED`
- **Transitions**:
  - `PENDING_APPROVAL`: Agent submits the booking sheet. Temporarily locks the Inventory Unit.
  - `CONFIRMED`: Finance/MD verifies initial deposit payment. Unit is permanently locked.
  - `CANCELLED`: MD/Finance approved cancellation. Unlocks Inventory Unit.

## 5. Site Visit Lifecycle (Existing foundation)
- **States**: `PENDING_VERIFICATION` -> `CONFIRMED` -> `ASSIGNED_TO_AGENT` -> `COMPLETED` | `CANCELLED` | `RESCHEDULED`

## 6. Audit Requirements
- Every state transition must generate an `AuditEvent` recording the actor, timestamp, old state, new state, and associated entity IDs.
