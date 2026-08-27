# RRH-CRMS Current Domain Model

## Overview
This document reconstructs the current domain model based on the existing Prisma schema, backend services, and frontend usage in the repository.

## Current Core Entities

### 1. Employee (EMS Foundation)
- **Purpose**: Represents an internal staff member (Telecaller, PM, Agent, MD, HR).
- **Database Model**: `Employee`
- **Ownership**: Belongs to `Company` and `Branch`.
- **Relationships**: Owns Tasks, Daily Reports, Attendance, Leads, Site Visits.
- **Workflow**: Manages login, hierarchy (`reporting_manager`), roles, permissions.
- **Status**: Preserve and extend. Forms the backbone of the system's RBAC.

### 2. Company & Branch
- **Purpose**: Defines tenant isolation and physical locations.
- **Database Model**: `Company`, `Branch`
- **Status**: Preserve.

### 3. Lead
- **Purpose**: Currently serves as the singular CRM object tracking a person from raw prospect through qualification, site visits, negotiation, and closure (`WON`/`LOST`).
- **Database Model**: `Lead`
- **Ownership**: Scoped to `company_id`.
- **Relationships**: Has `LeadActivity`, `LeadMatchingRequirement`, `LeadPropertyInterest`, `SiteVisitBooking`.
- **Status**: Conceptually overloaded. Should be decomposed into `Lead`, `Customer`, and `Opportunity`.

### 4. Property
- **Purpose**: Represents a specific physical real estate asset (e.g., Villa, Plot) available for sale.
- **Database Model**: `Property`
- **Ownership**: Scoped to `company_id`.
- **Relationships**: Has `PropertyImage`, `SiteVisitBooking`, `LeadPropertyInterest`.
- **Status**: Currently acts as both an inventory unit and a general listing. Should be re-evaluated alongside `Project` and `Unit` concepts.

### 5. SiteVisitBooking
- **Purpose**: Orchestrates the multi-actor physical visit to a property.
- **Database Model**: `SiteVisitBooking`
- **Ownership**: Inherits implicit ownership from `Lead.company_id` / Telecaller.
- **Relationships**: Links `Lead`, `Property`, `Telecaller`, `Project Manager`, `Field Agent`.
- **Status**: Strong workflow foundation, but heavily coupled to `Lead` instead of `Opportunity`. Preserve but migrate relations later.

### 6. Channel Partner
- **Purpose**: External agencies referring leads for commission.
- **Database Model**: `ChannelPartner`, `CPPayout`
- **Ownership**: Scoped to `company_id`.
- **Status**: Preserve.

### 7. Task & DailyReport
- **Purpose**: Internal operations monitoring.
- **Database Model**: `Task`, `DailyReport`, `DailyTarget`, `PerformanceSnapshot`
- **Ownership**: Tied to `Employee`.
- **Status**: Preserve (EMS core).
