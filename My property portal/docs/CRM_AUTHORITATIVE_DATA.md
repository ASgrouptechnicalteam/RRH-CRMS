# CRM AUTHORITATIVE DATA — MY PROPERTY

## 1. CUSTOMER

CRM is authoritative for:

- CRM Customer ID
- Customer name
- Registered mobile number
- Email
- Customer identity information
- Customer status
- KYC status
- Address information required for authorized customer-facing display
- Customer relationship information
- Customer account/business status

---

## 2. CUSTOMER ↔ PROPERTY RELATIONSHIP

CRM is authoritative for:

- Customer ID
- Property ID
- Ownership relationship
- Ownership status
- Ownership start/effective date
- Current owner
- Previous owner
- Ownership transfer information
- Historical ownership relationship where permitted
- Joint ownership information where supported by CRM

---

## 3. COMPANY

CRM is authoritative for:

- Company ID
- Company name
- Company/brand
- Company status
- Company relationship

---

## 4. PROJECT

CRM is authoritative for:

- Project ID
- Project code
- Project name
- Company
- Project location
- Project address
- Project type
- Project status
- Project description/information
- Project development information
- Project progress
- Project completion status
- CRM-controlled project information

---

## 5. PROPERTY / INVENTORY

CRM is authoritative for:

- Property ID
- Plot/unit/flat number
- Property type
- Property category
- Area/size
- Built-up area where applicable
- Plot area where applicable
- BHK where applicable
- Floor where applicable
- Facing
- Property price
- Price per sq.ft. where applicable
- Current property rate/value
- Availability
- Property status
- Inventory status
- Project relationship
- Property location
- Property-specific CRM information

---

## 6. BOOKING

CRM is authoritative for:

- Booking ID
- Customer
- Property/unit
- Project
- Booking date
- Booking status
- Booking amount
- Purchase price/value
- Payment mode
- Expected amount
- Booking confirmation status
- Booking notes
- Booking-related documents/references
- Booking history

---

## 7. PURCHASE / FINANCIAL FACTS

CRM is authoritative for:

- Purchase price
- Booking amount
- Total property value
- Amount paid
- Amount outstanding
- Payment status
- Financial status
- Purchase/booking history

---

## 8. EMI SCHEDULE

CRM is authoritative for:

- EMI schedule ID
- Booking/property relationship
- Customer
- Total payable amount
- Number of installments
- Installment schedule
- Installment ID
- Installment number
- Due amount
- Due date
- Paid amount
- Unpaid amount
- Outstanding amount
- Installment status
- Overdue/late status
- EMI status

---

## 9. PAYMENTS

CRM is authoritative for:

- Payment ID
- Payment reference
- Customer
- Property
- Booking
- Installment
- Payment amount
- Payment date
- Payment method
- Transaction/reference number
- Payment status
- Payment verification/completion status
- Payment history
- Payment remarks where applicable

---

## 10. PROPERTY STATUS

CRM is authoritative for:

- Available
- Reserved
- Booked
- Sold
- Registered
- Cancelled
- Resale/transfer status
- Blocked
- Other CRM-defined inventory statuses

---

## 11. OWNERSHIP / SALE / TRANSFER

CRM is authoritative for:

- Current owner
- Previous owner
- Ownership status
- Sale status
- Transfer status
- Transfer date
- Ownership transfer completion
- Sale completion
- Transfer history

---

## 12. CUSTOMER JOURNEY

Where exposed to My Property, CRM is authoritative for:

- Lead/customer status
- Qualification status
- Property recommendation status
- Contact status
- Site visit status
- Negotiation status
- Booking status
- Payment status
- Construction/handover status
- Customer lifecycle status

Only customer-facing information may be exposed.

Internal CRM notes, internal sales information, private employee information and other restricted CRM data must remain private.

---

# AUTHORITATIVE OWNERSHIP RULE

The following business facts MUST NOT be independently re-created as a competing source of truth inside My Property:

Customer identity
Property inventory
Customer-property relationship
Ownership
Booking
Purchase value
EMI schedule
Installments
Payment facts
Sale
Transfer

My Property must consume these through the approved CRM integration/API.

---

# DATA FLOW

CRM
↓
Approved Integration/API
↓
My Property
↓
Authorized Customer/Employee View

My Property must NOT silently modify CRM-authoritative business facts.

---

# CUSTOMER VISIBILITY RULE

Customers may only receive CRM information relating to:

- Their own customer record
- Their own properties
- Their own bookings
- Their own ownership
- Their own EMI/installments
- Their own payment history
- Their authorized documents
- Their authorized customer-facing project/property information

Never expose another customer's CRM information.

---

# EMPLOYEE VISIBILITY RULE

CRM information exposed to employees must follow the My Property RBAC and project/customer authorization rules.

Do not expose sensitive CRM fields unnecessarily.

---

# IMPORTANT INTEGRATION RULE

Do not invent CRM fields that are not supported by the actual CRM.

After creating this document, compare this specification against the actual CRM schema/API documentation available in the project.

If a field cannot currently be mapped to the CRM, mark it clearly as:

`CRM MAPPING REQUIRED`

Do not fabricate a CRM endpoint or field.
