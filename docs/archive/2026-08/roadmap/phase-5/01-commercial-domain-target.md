# Phase 5: Commercial Domain Target

## Target Architecture

The Phase 5 target is to introduce the commercial transaction layer that bridges the CRM pipeline (Lead/Customer) with Inventory (Property). The core entities will be `Booking` and `Payment`.

### 1. CUSTOMER
**Role:** The person/entity buying or reserving.
**Status:** Already implemented in Phase 3.
**Relationship:** A Customer can have many Bookings. A Booking MUST belong to a Customer.

### 2. OPPORTUNITY
**Role:** Commercial sales intent.
**Status:** NOT REQUIRED for this phase.
**Reasoning:** The `Opportunity` entity does not currently exist. The `Lead` pipeline already tracks sales intent through `NEGOTIATION` and `WON` statuses. Building a separate `Opportunity` CRM would introduce unnecessary duplication and complexity out of scope for Phase 5. `Booking` will link directly to `Customer`.

### 3. PROPERTY (INVENTORY)
**Role:** The inventory being sold.
**Status:** Already implemented, but requires state extensions.
**Extensions:** The `Property` entity acts as our Unit. It must support `BOOKED` and `SOLD` statuses to reflect availability and prevent double-booking.

### 4. BOOKING
**Role:** Commercial reservation/commitment connecting Customer and Property.
**Status:** NEW.
**Relationship:** Belongs to `Company`, `Customer`, and `Property`. 
**Purpose:** Locks a property, establishing the financial agreement (Booking Amount, Agreed Price) and acting as the parent for Payments.

### 5. PAYMENT
**Role:** A financial transaction against a Booking.
**Status:** NEW.
**Relationship:** Belongs to `Company` and `Booking`.
**Purpose:** Tracks monetary receipts from the Customer. Immutability will be preferred to protect financial integrity, supporting cancellations or status updates rather than silent overwrites of historical amounts.

## Minimum Phase 5 Target
- Create `Booking` model.
- Create `Payment` model.
- Extend `Property` to support `BOOKED` and `SOLD` lifecycle states.
- Establish robust authorization, workflow, and tenant isolation around Bookings and Payments.
