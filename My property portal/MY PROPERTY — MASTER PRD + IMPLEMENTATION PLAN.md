# **MY PROPERTY — MASTER PRD \+ IMPLEMENTATION PLAN**

**Version:** 1.0  
**Date:** September 4, 2026  
**Project:** My Property  
**Product Type:** Multi-Company Property Lifecycle Management Platform  
**Initial Companies:** Sonthillu and Radha Real Home

This document is the **master baseline** for development. Future My Property implementation work should follow this PRD unless you explicitly change a requirement.

---

# **PART A — PRODUCT REQUIREMENTS DOCUMENT**

## **1\. Product Vision**

My Property is a centralized platform for managing the complete lifecycle of a customer's property while providing customers with a secure self-service portal.

The system connects:

**Company → Project → Property → Booking → Customer → EMI → External Payment → Payment Proof → Verification → Documents → Development → Construction → Market Value → Resale**

The platform serves both internal employees and customers.

---

# **2\. Supported Companies**

The architecture must support multiple companies.

Initial companies:

- Sonthillu
- Radha Real Home

Future companies can be added without redesigning the core database.

Example:

MY PROPERTY  
│  
├── Sonthillu  
│ ├── Project A  
│ ├── Project B  
│ └── Project C  
│  
└── Radha Real Home  
├── Project A  
├── Project B  
└── Project C

A customer can own properties across multiple companies.

---

# **3\. User Roles**

## **3.1 Managing Director — MD**

Organization-wide management.

## **3.2 Project Manager — PM**

Manages assigned projects.

A PM can manage multiple projects.

## **3.3 Field Manager — FM**

Handles field/site operations.

An FM can manage **only one project at a time**.

## **3.4 Data Entry Manager — DEM**

Central operational data-entry role.

## **3.5 Customer**

Can access only their own customer/property information.

---

# **4\. Authentication**

There is **one login page**.

MY PROPERTY

User ID / Registered Phone  
Password

\[ LOGIN \]

Forgot Password?

### **Customer**

Uses registered phone number.

### **Employees**

Use employee/user ID.

### **Required authentication functionality**

- Login
- Logout
- Forgot password
- Reset password
- Change password
- Password hashing
- Session management
- Session expiry
- Login history
- Failed-login protection
- Account activation/deactivation
- RBAC
- API-level authorization

---

# **5\. Customer First Login**

The first login must show:

**Customer Policies & Responsibilities**

Customer must select:

**I Agree**

before entering the portal.

Store:

- Customer
- Policy version
- Acceptance status
- Date
- Time

If a new mandatory policy version is introduced, the customer may be required to accept it again.

---

# **6\. Core Business Architecture**

Company  
│  
└── Projects  
│  
└── Properties  
│  
├── Booking  
│  
└── Customer  
│  
└── EMI Schedule  
│  
└── Installment  
│  
└── Payment  
│  
└── Payment Proof  
│  
└── Verification

Additional property/customer information:

Property  
├── Documents  
├── Property Updates  
├── Construction Updates  
├── Location  
├── Market Value History  
└── Resale
---

# **7\. Critical Payment Rule**

## **Customers CANNOT pay through My Property.**

There must be:

- No payment gateway
- No Pay Now
- No checkout
- No online EMI payment
- No customer payment transaction

Customers pay externally through approved company methods.

Examples:

- Bank transfer
- UPI
- Cheque
- Cash
- Other approved company methods

---

# **8\. Payment Workflow**

Customer pays externally  
↓  
DEM receives payment information  
↓  
DEM enters payment  
↓  
DEM uploads payment proof  
↓  
Pending Verification  
↓  
Authorized employee verifies  
↓  
Approved  
↓  
Customer financial record updated  
↓  
Customer notified

Rejected:

Pending Verification  
↓  
Rejected  
↓  
Rejection reason  
↓  
DEM corrects/re-uploads  
↓  
Verification

Only approved payments count toward collected amounts.

---

# **9\. EMI Architecture**

Never use a simple boolean such as:

emiPaid \= true

Use:

Customer  
↓  
Property  
↓  
EMI Schedule  
↓  
Installment  
↓  
Payment  
↓  
Payment Proof  
↓  
Verification

This supports:

- Partial payments
- Multiple payments
- Late payments
- Rejected payments
- Corrections
- Multiple proofs
- Complete financial history

### **EMI statuses**

- Paid
- Pending
- Late
- Partially Paid
- Waived
- Cancelled

---

# **10\. MD Dashboard**

## **Customer**

- Total customers
- Active customers
- New customers
- Customers with properties
- Customers with multiple properties

## **EMI/Payments**

- Total expected
- Total collected
- Pending
- Late
- Monthly collection
- Yearly collection
- Collection rate

## **Projects**

- Total
- Active
- Completed
- Upcoming
- Suspended

## **Properties**

- Total
- Available
- Reserved
- Booked
- Sold
- Registered
- Resale
- Cancelled

---

# **11\. Project Management**

Each project contains:

- Project ID
- Company
- Name
- Code
- Location
- Address
- GPS
- Property type
- Total area
- Total plots/flats
- Starting price
- Current price
- Development status
- Construction status
- PM
- FM
- Status
- Launch date
- Expected completion
- Description
- Images
- Documents

---

# **12\. Employee Management**

MD can manage:

### **PM**

- Employee ID
- Name
- Phone
- Email
- Status
- Assigned projects

### **FM**

- Employee ID
- Name
- Phone
- Email
- Status
- Assigned project

### **DEM**

- Employee ID
- Name
- Phone
- Email
- Status

MD actions:

- Add
- Edit
- Activate
- Deactivate
- Reset password
- Assign
- Reassign
- View activity

Backend must prevent an FM from being assigned multiple active projects.

---

# **13\. Property Management**

Property types:

- Plot
- Flat

Information:

- Property number
- Type
- Area
- Facing
- Price
- Current indicative market value
- Availability
- Customer
- Booking
- EMI
- Registration
- Development
- Construction
- Documents
- Photos
- Location
- History

Statuses:

- Available
- Reserved
- Booked
- Sold
- Registered
- Cancelled
- Resale
- Blocked

---

# **14\. Customer Management**

MD customer list:

- Customer ID
- Name
- Phone
- Email
- Number of properties
- Companies
- Projects
- Total purchase value
- Amount paid
- Remaining amount
- EMI status
- Last payment
- Account status

### **Search**

- Name
- Customer ID
- Phone
- Plot
- Flat
- Booking ID
- Project
- Company

### **Filters**

- Company
- Project
- Payment status
- EMI status
- Property type
- Customer status
- Location

---

# **15\. Customer 360°**

Customer profile contains:

### **Personal information**

- Customer ID
- Name
- Phone
- Email
- Address
- Profile
- Registration date
- Status

### **Properties**

For every property:

- Company
- Project
- Plot/flat
- Type
- Area
- Facing
- Purchase price
- Current indicative market value
- Paid
- Remaining
- EMI
- Booking
- Registration
- Status

### **Timeline**

Chronological events such as:

- Booking
- Payment entered
- Payment approved
- Document uploaded
- Document approved
- Project update
- Construction update
- Resale request

---

# **16\. PM Module**

PM can manage assigned projects.

Capabilities:

- Project management
- Property management
- Pricing
- Price history
- Construction
- Project updates
- Customer viewing
- Documents
- Verification

---

# **17\. Price Management**

PM can update:

- Property price
- Price/sq.ft
- Development charges
- Other charges

History:

- Previous price
- New price
- Reason
- Updated by
- Date/time

---

# **18\. Construction Management**

Track:

- Construction stage
- Overall percentage
- Start date
- Expected completion
- Completed work
- Current work
- Upcoming work
- Delays
- Delay reason
- Photos
- Videos
- Remarks

---

# **19\. FM Module**

FM is restricted to one assigned project.

### **Plot updates**

- Site status
- Road
- Boundary
- Electricity
- Water
- Drainage
- Development
- Construction
- Photos
- Videos
- GPS
- Remarks

### **Flat updates**

- Floor
- Flat status
- Construction stage
- Electrical
- Plumbing
- Flooring
- Doors/windows
- Painting
- Handover

---

# **20\. DEM Module**

DEM handles:

- Customer data
- Property data
- Booking data
- EMI
- External payment records
- Payment proofs
- Documents
- Project information
- Property updates
- Construction updates
- Location updates
- Offers
- Carousels
- Popups
- Announcements

DEM creates/enters data but does not bypass required verification.

---

# **21\. Documents**

## **Customer documents**

- ID proof
- Address proof
- Application
- KYC
- Agreements
- Other

## **Property documents**

- Booking
- Sale agreement
- Registration
- Receipts
- Payment documents
- NOCs
- Certificates
- Other

Metadata:

- Type
- Uploaded by
- Upload date
- Verification status
- Verified by
- Verification date
- Version
- Remarks

---

# **22\. Customer Portal**

Customer navigation:

Home  
My Properties  
EMI & Payments  
Documents  
Property Updates  
Project Updates  
Location  
Market Value  
Resale  
Document Submission  
Policies  
Notifications  
Profile

Customer only sees their own information.

---

# **23\. Customer Home Page**

The final order is:

POPUP  
↓  
CAROUSEL  
↓  
WELCOME / SUMMARY  
↓  
PROPERTY SUMMARY  
↓  
EMI SUMMARY  
↓  
OFFERS  
↓  
RECENT UPDATES  
↓  
NOTIFICATIONS
---

# **24\. Carousel**

The carousel is displayed at the **top of the first/home page**.

Features:

- Multiple slides
- Automatic rotation
- Previous/next
- Indicators
- Image
- Title
- Description
- Button
- Link/action
- Start date
- End date
- Priority
- Company targeting
- Project targeting
- Audience targeting
- Approval
- Publishing
- Expiry

Only active approved content is displayed.

---

# **25\. Popup**

The popup appears **every time the user opens the webapp/website**.

It should not become permanently disabled after dismissal.

Track:

- Displayed
- Viewed
- Dismissed
- Button clicked
- User
- Timestamp

Supports:

- Company targeting
- Project targeting
- Audience targeting
- Scheduling
- Priority
- Image
- Title
- Message
- Button
- Approval
- Expiry

---

# **26\. Offers**

Offers appear in the Home page's **Offers section**.

Examples:

- Registration benefits
- Development offers
- Referral benefits
- Special customer benefits
- Project offers
- Limited-time offers

Fields:

- Offer ID
- Title
- Description
- Offer type
- Value
- Terms
- Image
- Company
- Project
- Eligible customers
- Eligible properties
- Start date
- End date
- Status
- Created by
- Verified by

Important offers may also be promoted through carousel or popup.

---

# **27\. Content Workflow**

For:

- Carousels
- Popups
- Offers
- Announcements

Workflow:

Create  
↓  
Draft  
↓  
Submit  
↓  
Pending Verification  
↓  
Approved  
↓  
Published  
↓  
Expired

Rejected:

Rejected  
↓  
Reason  
↓  
Edit  
↓  
Resubmit
---

# **28\. Project & Property Updates**

Customers can view:

- Site updates
- Development
- Construction
- Infrastructure
- Photos
- Videos
- Roads
- Electricity
- Water
- Amenities
- Landscaping

---

# **29\. Location**

Customer can see:

- Project location
- Map
- GPS
- Roads
- Nearby infrastructure
- Nearby developments
- Site photos

Future enhancement:

**Interactive project map with plot/flat locations.**

---

# **30\. Market Value**

Customer sees:

- Purchase price
- Current indicative market value
- Difference
- Percentage change
- Development-related explanation

Must clearly state:

**Company-provided / indicative market value**

It is not a guaranteed resale price.

Maintain historical values.

---

# **31\. Resale**

Customer submits:

- Property
- Expected selling price
- Reason
- Preferred contact
- Message
- Supporting documents

Workflow:

Submitted  
↓  
Under Review  
↓  
Approved / Rejected  
↓  
Processing  
↓  
Completed
---

# **32\. Customer Document Submission**

Required  
↓  
Upload  
↓  
Submitted  
↓  
Verification  
↓  
Approved / Rejected
---

# **33\. Notifications**

Customer notifications:

- Payment recorded
- Payment approved
- EMI due
- EMI overdue
- Document uploaded
- Document approved/rejected
- Property update
- Project update
- Construction update
- Location update
- Market value update
- Offer
- Carousel announcement
- Popup announcement
- Resale update
- Document submission update

Employee notifications:

- Project assigned/reassigned
- Verification required
- Update approved/rejected
- Customer document uploaded
- Payment entered
- Payment verification required
- MD announcement

After login:

> Welcome to My Property. Thank you for logging in.

---

# **34\. Reports & Analytics**

MD reports:

- Customer
- Property
- EMI
- Payment
- Project
- Revenue
- Development
- Construction

Exports:

- Excel
- CSV
- PDF

Analytics:

- Customer growth
- Collection
- Pending EMI
- Late EMI
- Sales
- Property status
- Development
- Construction
- Monthly collection
- Company comparison

Only approved payments count toward collected amounts.

---

# **35\. Audit Logs**

Track:

- User
- Action
- Entity
- Old value
- New value
- Date/time
- Reason
- Approval/rejection

Critical areas:

- Payments
- EMI
- Property prices
- Documents
- Customer information
- Project changes
- Resale
- Approvals

---

# **36\. Global Search**

Employee search:

- Customer
- Customer ID
- Phone
- Plot
- Flat
- Booking ID
- Project
- Company

---

# **37\. Security**

Required:

- Secure authentication
- bcrypt
- JWT
- HttpOnly cookies
- RBAC
- API authorization
- Input validation
- File validation
- File-size restrictions
- Secure document access
- Rate limiting
- Login protection
- Session expiry
- HTTPS
- Database backups
- Environment variables
- Audit logs

---

# **PART B — LOCKED TECHNICAL ARCHITECTURE**

The My Property project will use the **same architecture as the Associate Partner Portal**.

## **Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS **v4.3.3**
- Axios
- Lucide React
- vite-plugin-pwa
- manifest
- service worker

## **Backend**

- Node.js
- Express
- TypeScript

## **Database**

- MariaDB/MySQL

## **ORM**

- Prisma **5.22.0**

## **Authentication**

- bcrypt
- JWT
- HttpOnly cookies

## **Explicitly excluded**

Unless you explicitly change the architecture:

- PostgreSQL
- MongoDB
- Fastify
- Sequelize
- TypeORM
- Drizzle
- TanStack Query
- React Hook Form
- Alternative ORM
- Alternative frontend framework

---

# **PART C — IMPLEMENTATION PLAN**

# **PHASE 0 — Requirements & Architecture**

### **Objective**

Freeze the system architecture before writing application code.

### **Work**

1. Review PRD
2. Define system architecture
3. Define role matrix
4. Define permissions
5. Define database entities
6. Define workflows
7. Define API modules
8. Define frontend routes
9. Define security model
10. Define content architecture

### **Deliverables**

- Architecture document
- ERD
- Permission matrix
- Route map
- API map
- Workflow definitions
- UI sitemap

### **Phase 0 prompt**

You are implementing the My Property Property Lifecycle Management Platform.

Use the My Property PRD v1.0 as the authoritative business specification.

Use the locked Associate Partner Portal technical architecture:

Frontend:  
React \+ TypeScript \+ Vite  
Tailwind CSS v4.3.3  
Axios  
Lucide React  
vite-plugin-pwa

Backend:  
Node.js \+ Express \+ TypeScript

ORM:  
Prisma 5.22.0

Database:  
MariaDB/MySQL

Authentication:  
bcrypt \+ JWT \+ HttpOnly cookies

Do not introduce:  
PostgreSQL, MongoDB, Fastify, another ORM,  
TanStack Query, React Hook Form, or another frontend framework.

Do NOT start coding yet.

Produce:

1\. Complete application architecture  
2\. Frontend architecture  
3\. Backend architecture  
4\. Database architecture  
5\. Role architecture  
6\. RBAC architecture  
7\. API module architecture  
8\. Frontend route architecture  
9\. Customer data-isolation strategy  
10\. Payment workflow  
11\. Document workflow  
12\. Content approval workflow  
13\. Notification architecture  
14\. Audit architecture  
15\. PWA architecture  
16\. Security architecture  
17\. Phase-by-phase implementation roadmap

Critical business rules:  
\- Customers cannot pay inside the application.  
\- There is no payment gateway.  
\- There is no Pay Now.  
\- DEM enters externally received payments.  
\- DEM uploads payment proofs.  
\- Authorized personnel verify payments.  
\- Only approved payments update financial balances.  
\- Customers can own multiple properties across companies.  
\- PM can manage multiple projects.  
\- FM can manage only one project.  
\- Carousel appears at the top of the customer Home page.  
\- Popup appears every time the webapp/website is opened.  
\- Offers appear in the Home page Offers section.

Do not invent conflicting business rules.
---

# **PHASE 1 — Database Foundation**

### **Objective**

Create the complete Prisma/MySQL data model.

### **Main entities**

Company  
Project  
Property  
Customer  
Booking  
EMISchedule  
Installment  
Payment  
PaymentProof  
Employee  
Role  
Assignment  
Document  
ProjectUpdate  
PropertyUpdate  
ConstructionUpdate  
LocationUpdate  
MarketValueHistory  
ResaleRequest  
Notification  
Carousel  
Popup  
Offer  
Announcement  
Policy  
PolicyAcceptance  
AuditLog

### **Prompt**

Implement Phase 1 of My Property.

Use the approved Phase 0 architecture.

Technology:  
\- Prisma 5.22.0  
\- MariaDB/MySQL  
\- TypeScript

Create the complete database schema.

Core hierarchy:

Company  
→ Project  
→ Property  
→ Booking  
→ Customer

Financial hierarchy:

Customer  
→ Property  
→ EMI Schedule  
→ Installment  
→ Payment  
→ Payment Proof  
→ Verification

Also implement entities for:

Employees  
Roles  
Assignments  
Documents  
Project Updates  
Property Updates  
Construction Updates  
Location Updates  
Market Value History  
Resale Requests  
Notifications  
Carousels  
Popups  
Offers  
Announcements  
Policies  
Policy Acceptances  
Audit Logs

Requirements:

\- Multiple companies  
\- Multiple projects per company  
\- Multiple properties per project  
\- Multiple properties per customer  
\- Customer properties across companies  
\- Multiple payments per installment  
\- Partial payments  
\- Payment proof  
\- Verification status  
\- Rejection reason  
\- Document versions  
\- Content approval workflow  
\- Audit history  
\- Proper indexes  
\- Foreign keys  
\- Unique constraints where appropriate  
\- Created/updated timestamps

Do not create a payment gateway model.

Do not use emiPaid=true as the financial architecture.

First validate the schema and relationships before proceeding.
---

# **PHASE 2 — Authentication & RBAC**

### **Objective**

Implement secure authentication.

### **Work**

- Login
- Logout
- Customer phone login
- Employee ID login
- bcrypt
- JWT
- HttpOnly cookies
- RBAC
- Password reset
- Sessions
- Policy acceptance
- Login history
- Failed login protection

### **Prompt**

Implement Phase 2 of My Property.

Use React \+ TypeScript \+ Vite on the frontend.

Use Node.js \+ Express \+ TypeScript on the backend.

Use bcrypt \+ JWT \+ HttpOnly cookies.

Implement:

1\. Single login page  
2\. Customer phone-number login  
3\. Employee ID login  
4\. Password hashing  
5\. JWT authentication  
6\. HttpOnly cookie authentication  
7\. Logout  
8\. Password change  
9\. Password reset  
10\. Session expiry  
11\. Account activation/deactivation  
12\. Login history  
13\. Failed-login protection  
14\. Role-based authorization  
15\. API-level authorization  
16\. Customer first-login policy acceptance

Roles:  
MD  
PM  
FM  
DEM  
Customer

Authorization rules:

Customer → own records only  
PM → assigned projects only  
FM → assigned project only  
DEM → authorized operations only  
MD → organization-wide authorized access

Enforce authorization on the backend.

Do not rely only on frontend route protection.

Write tests for unauthorized access.
---

# **PHASE 3 — MD Portal**

### **Objective**

Build the organizational management system.

### **Modules**

- Dashboard
- Companies
- Projects
- Properties
- Customers
- Customer 360
- Employees
- Assignments

### **Prompt**

Implement Phase 3 of My Property.

Build the MD portal.

Use the approved PRD and existing authentication architecture.

Implement:

1\. MD dashboard  
2\. Company management  
3\. Project management  
4\. Property management  
5\. Customer management  
6\. Customer 360  
7\. PM management  
8\. FM management  
9\. DEM management  
10\. Project assignments  
11\. Employee activation/deactivation  
12\. Employee password reset  
13\. Search  
14\. Filters  
15\. Audit logging

Dashboard must show:

Customers:  
\- Total  
\- Active  
\- New  
\- Multiple-property customers

Financial:  
\- EMI expected  
\- Collected  
\- Pending  
\- Late  
\- Monthly collection  
\- Yearly collection  
\- Collection rate

Projects:  
\- Total  
\- Active  
\- Completed  
\- Upcoming  
\- Suspended

Properties:  
\- Available  
\- Reserved  
\- Booked  
\- Sold  
\- Registered  
\- Resale  
\- Cancelled

Enforce company/project permissions through backend APIs.
---

# **PHASE 4 — PM & FM**

### **Objective**

Implement project operations.

### **PM**

- Projects
- Properties
- Pricing
- Construction
- Project updates
- Documents
- Verification

### **FM**

- Assigned project
- Plot updates
- Flat updates
- Site updates
- Construction
- Media
- Location

### **Prompt**

Implement Phase 4 of My Property.

Build the PM and FM portals.

PM functionality:

\- Assigned projects  
\- Project details  
\- Property management  
\- Property status  
\- Pricing  
\- Price history  
\- Development  
\- Construction  
\- Project updates  
\- Customer viewing  
\- Documents  
\- Pending verification

FM functionality:

\- One assigned project only  
\- Project dashboard  
\- Plot updates  
\- Flat updates  
\- Site updates  
\- Construction updates  
\- Infrastructure updates  
\- Photos/videos  
\- GPS/location  
\- Remarks  
\- Pending verification

Important:

Backend must prevent FM from accessing any project other than the currently assigned project.

PM must access only assigned projects.

Every update must support verification and audit history.

Do not implement payment gateway functionality.
---

# **PHASE 5 — DEM**

### **Objective**

Build the operational data-entry platform.

### **Modules**

- Customers
- Properties
- Bookings
- EMI
- Payments
- Payment proofs
- Documents
- Project data
- Updates
- Offers
- Carousels
- Popups
- Announcements

### **Prompt**

Implement Phase 5 of My Property.

Build the DEM portal.

DEM must be able to enter:

Customer data  
Property data  
Booking data  
EMI schedules  
Installments  
External payments  
Payment proofs  
Documents  
Project data  
Property updates  
Construction updates  
Location updates  
Offers  
Carousels  
Popups  
Announcements

Payment workflow:

Customer pays externally.  
DEM receives payment information.  
DEM enters payment.  
DEM uploads proof.  
Payment becomes Pending Verification.  
Authorized employee verifies.  
Only Approved payments update financial balances.

Support:

\- Partial payments  
\- Multiple payments  
\- Payment rejection  
\- Rejection reason  
\- Corrections  
\- Proof replacement  
\- Complete history

Never create:  
\- Pay Now  
\- Checkout  
\- Payment gateway  
\- Customer payment form

Implement proper validation and audit logging.
---

# **PHASE 6 — Customer Portal**

### **Objective**

Build the customer-facing experience.

### **Modules**

- Home
- Properties
- EMI
- Payments
- Documents
- Updates
- Location
- Market Value
- Resale
- Document Submission
- Policies
- Notifications
- Profile

### **Prompt**

Implement Phase 6 of My Property.

Build the customer portal.

Customer must only see their own data.

Implement:

1\. Home  
2\. My Properties  
3\. Property details  
4\. EMI & Payments  
5\. Approved payment history  
6\. Approved payment proofs  
7\. Documents  
8\. Property updates  
9\. Project updates  
10\. Construction updates  
11\. Location  
12\. Market value  
13\. Market value history  
14\. Resale requests  
15\. Document submission  
16\. Policies  
17\. Notifications  
18\. Profile

Customer payment restriction:

Customers cannot pay through My Property.

Do not create:  
\- Pay Now  
\- Payment gateway  
\- Checkout  
\- Online payment form

Customer balances must be calculated from approved payments.

Enforce customer data isolation at API level.
---

# **PHASE 7 — Carousels, Popups, Offers & Notifications**

### **Objective**

Build the communication/content system.

### **Final customer Home structure**

Popup  
↓  
Carousel  
↓  
Summary  
↓  
Properties  
↓  
EMI  
↓  
Offers  
↓  
Updates  
↓  
Notifications

### **Prompt**

Implement Phase 7 of My Property.

Build:

1\. Carousel management  
2\. Popup management  
3\. Offer management  
4\. Announcement management  
5\. Notification system

CAROUSEL:

\- Display at the TOP of the customer Home page.  
\- Multiple slides.  
\- Automatic rotation.  
\- Manual controls.  
\- Indicators.  
\- Image.  
\- Title.  
\- Description.  
\- CTA.  
\- Company targeting.  
\- Project targeting.  
\- Audience targeting.  
\- Start/end dates.  
\- Priority.  
\- Approval.  
\- Publishing.  
\- Expiry.

POPUP:

\- Display every time the user opens the webapp/website.  
\- Do not permanently suppress it after dismissal.  
\- Track displayed.  
\- Track viewed.  
\- Track dismissed.  
\- Track button clicks.  
\- Support company/project/audience targeting.  
\- Support scheduling.  
\- Support priority.  
\- Support approval.  
\- Support expiry.

OFFERS:

\- Display in the Home page Offers section.  
\- Company/project targeting.  
\- Customer/property eligibility.  
\- Terms and conditions.  
\- Start/end date.  
\- Approval.  
\- Publishing.  
\- Expiry.

Important offers may also be promoted using carousel or popup.

Content workflow:

Create  
→ Draft  
→ Submit  
→ Pending Verification  
→ Approved/Rejected  
→ Published  
→ Expired

Implement notification center and relevant notifications for customers and employees.
---

# **PHASE 8 — Reports, Analytics & Audit**

### **Objective**

Build management intelligence.

### **Prompt**

Implement Phase 8 of My Property.

Implement:

1\. Customer reports  
2\. Property reports  
3\. EMI reports  
4\. Payment reports  
5\. Project reports  
6\. Revenue reports  
7\. Company comparison  
8\. Customer analytics  
9\. Collection analytics  
10\. Construction analytics  
11\. Development analytics  
12\. Audit log viewer  
13\. Excel export  
14\. CSV export  
15\. PDF export

Important:

Financial reports must calculate collected amounts using only Approved payments.

Do not count:  
\- Pending payments  
\- Rejected payments

Audit logs must contain:

\- User  
\- Action  
\- Entity  
\- Old value  
\- New value  
\- Reason  
\- Timestamp

Follow the existing architecture and do not introduce alternative libraries unnecessarily.
---

# **PHASE 9 — Security, Testing & Deployment**

### **Objective**

Make the platform production-ready.

### **Testing categories**

#### **Authentication**

- Login
- Logout
- Password reset
- Password change
- Session expiry
- Failed login

#### **Authorization**

Test every role against restricted endpoints.

#### **Customer isolation**

Customer A → Customer B

Must fail.

#### **Project isolation**

FM Project A → Project B

Must fail.

#### **Payment**

Test:

- Partial payment
- Multiple payments
- Proof upload
- Rejected proof
- Corrected proof
- Approved payment
- Late EMI
- Balance calculation

#### **Content**

Test:

- Carousel positioning
- Carousel scheduling
- Carousel expiry
- Popup every-open behavior
- Offer targeting
- Offer expiry
- Approval/rejection

#### **Documents**

Test:

- Upload
- File validation
- Access control
- Verification
- Rejection
- Versioning

#### **PWA**

Test:

- Install
- Offline shell
- Service worker
- Updates
- Notifications where supported

### **Final security review**

- Authentication
- Authorization
- API security
- File security
- Cookie security
- Rate limiting
- Input validation
- Database permissions
- Environment variables
- HTTPS
- Backup
- Audit logs

---

# **PART D — COMPLETE DEVELOPMENT SEQUENCE**

PHASE 0  
Requirements \+ Architecture  
│  
▼  
PHASE 1  
Database \+ Prisma \+ MySQL  
│  
▼  
PHASE 2  
Authentication \+ RBAC  
│  
▼  
PHASE 3  
MD Portal  
│  
▼  
PHASE 4  
PM \+ FM Portal  
│  
▼  
PHASE 5  
DEM Portal  
│  
▼  
PHASE 6  
Customer Portal  
│  
▼  
PHASE 7  
Carousels \+ Popups \+ Offers \+ Notifications  
│  
▼  
PHASE 8  
Reports \+ Analytics \+ Audit  
│  
▼  
PHASE 9  
Security \+ Testing \+ Deployment

## **Development rule**

**Do not jump randomly between phases.**

For every phase, the working method should be:

**PRD requirement → architecture → database → backend/API → frontend/UI → permissions → testing → phase completion**

And for each phase, the coding prompt should explicitly reference the **My Property PRD \+ locked Associate Portal architecture**, so the implementation remains consistent.

I’ve saved this as the working baseline for the project. When you say **“continue My Property,” “start Phase 1,” “give Phase 3 prompt,” “update the PRD,”** etc., I’ll use this project baseline rather than rebuilding the requirements from scratch.
