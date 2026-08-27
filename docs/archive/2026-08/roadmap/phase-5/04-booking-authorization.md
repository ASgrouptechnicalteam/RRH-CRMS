# Phase 5: Booking Authorization

## Missing Booking Permissions
Currently, there are no booking-specific permissions in the central authorization matrix (`packages/shared/src/auth/permissions.ts`). We will introduce the following:

- `BOOKINGS_CREATE`: Can draft a new Booking against a Customer and Property.
- `BOOKINGS_READ`: Can read booking details. (Subject to Tenant/Ownership scope).
- `BOOKINGS_UPDATE`: Can modify a drafted booking.
- `BOOKINGS_CANCEL`: Can cancel a booking (restricted action).
- `BOOKINGS_CONFIRM`: Can confirm a booking after initial payment verification (typically Finance or Management).

## Role Assignments
- **MD / Admin**: All booking permissions.
- **Finance**: `BOOKINGS_READ`, `BOOKINGS_CONFIRM`, `BOOKINGS_CANCEL`.
- **Project Manager / Agent / Telecaller**: `BOOKINGS_READ`.
- **Digital Lead Operator / Sales**: `BOOKINGS_CREATE`, `BOOKINGS_READ`, `BOOKINGS_UPDATE`.

## Data Scope Restrictions (SiteVisitPolicy equivalent)
- A Booking inherits the `company_id` of the Customer.
- Users can only read Bookings within their `company_id`.
- Bookings created by an employee will remain visible to them and their management upline.
