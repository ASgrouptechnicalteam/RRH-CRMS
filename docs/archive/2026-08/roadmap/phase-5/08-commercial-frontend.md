# Phase 5: Commercial Frontend

## Scope
The frontend implementation will be strictly bound to providing visibility and recording interfaces for Bookings and Payments. Full accounting ledgers or complex financial dashboards are explicitly out of scope.

## Key Components

### 1. Booking List View
- **Path:** `/bookings`
- **Purpose:** Display all bookings accessible to the user (filtered by tenant and ownership).
- **Features:** 
  - Status filters (`PENDING`, `CONFIRMED`, `CANCELLED`).
  - Search by Booking Code, Customer Name, or Property Title.

### 2. Booking Detail View (Dossier)
- **Path:** `/bookings/:id`
- **Purpose:** Comprehensive view of the booking details, linked customer, linked property, and its payment history.
- **Actions (Permission Guarded):**
  - **Confirm Booking:** If `PENDING` and user has `BOOKINGS_CONFIRM`.
  - **Cancel Booking:** If user has `BOOKINGS_CANCEL`.
  - **Record Payment:** Triggers payment recording modal (if user has `PAYMENTS_CREATE`).

### 3. Record Payment Modal
- **Purpose:** Safely capture a payment transaction against the Booking.
- **Fields:** Amount, Payment Method (Cash, Cheque, Transfer), Reference Number, Notes, Date.
- **Constraints:** Prevent duplicate submission, disable submit while loading.

### 4. Create Booking Flow
- **Purpose:** Link a Customer to an available Property.
- **Fields:** Select Customer, Select Property (must be `LIVE`), Agreed Amount, Token Amount, Assigned Employee.
- **Constraints:** 
  - Ensure Property is not already `BOOKED`.
  - Ensure Tenant Isolation (cannot pick Cross-Company customers/properties).

## Security on the Frontend
- The UI must dynamically hide action buttons if the `user?.permissions` array lacks the corresponding `BOOKINGS_*` or `PAYMENTS_*` string.
- Never trust the UI. All frontend validations (e.g. double booking checks) will act as UX helpers while the true safety enforcement remains in the Prisma transactions in the API layer.
