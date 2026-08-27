# RRH-CRMS Target Domain Model

## Overview
This document defines the conceptual target domains for the fully realized RRH-CRMS business operating system.

## 1. Identity, Security & EMS
- **Purpose**: Manage authentication, access control, tenant isolation, and internal human resources.
- **Major Entities**: `Company`, `Branch`, `Employee`, `Role`, `Permission`, `AuthSession`.
- **Status**: Mostly exists. Forms the untouchable foundation of the application.

## 2. CRM Core (Lead & Customer)
- **Purpose**: Manage the top of the sales funnel and long-term relationships.
- **Major Entities**: `Lead`, `Customer`, `Activity`.
- **Status**: `Lead` exists but is overloaded. `Customer` needs to be introduced as the persistent identity after a `Lead` qualifies or purchases.

## 3. Sales & Opportunities
- **Purpose**: Track active deal pipelines and field operations.
- **Major Entities**: `Opportunity`, `SiteVisitBooking`, `Negotiation`.
- **Status**: `Opportunity` is missing (currently tracked via `Lead.status`). `SiteVisitBooking` exists but needs to link to `Opportunity` rather than `Lead` long-term.

## 4. Inventory & Projects
- **Purpose**: Manage the physical real estate assets available for sale.
- **Major Entities**: `Project`, `Phase`, `Block`, `Unit`.
- **Status**: Only `Property` exists, acting as a flat list of units. A hierarchical structure (`Project` -> `Unit`) is missing and required for scale.

## 5. Financial Bookings & Payments
- **Purpose**: Manage the transactional conversion of an opportunity.
- **Major Entities**: `Booking`, `PaymentSchedule`, `Payment`, `Receipt`.
- **Status**: Entirely missing. Requires strict financial integrity, inventory locking, and cancellation rules.

## 6. Channel Partner Ecosystem
- **Purpose**: External referral network management and commission payouts.
- **Major Entities**: `ChannelPartner`, `CPPayout`, `LeadProtectionLock`.
- **Status**: Exists and functional.

## 7. Document Management
- **Purpose**: Legal agreements, KYC documents, and generated PDFs (e.g., Booking Forms).
- **Major Entities**: `Document`, `Template`.
- **Status**: Missing.

## 8. Automation, Workflow & Audit
- **Purpose**: State machine enforcement, timers, SLA tracking, and historical audit logs.
- **Major Entities**: `AuditEvent`, `Notification`, `SlaTimer`.
- **Status**: Workflow engine and Audit logs partially exist. Timers/SLAs are missing.
