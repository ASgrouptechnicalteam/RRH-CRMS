# RRH-CRMS Lead, Customer, Opportunity Separation

## Overview
This document defines the conceptual separation of the sales pipeline objects, which are currently heavily overloaded onto the single `Lead` entity.

## 1. What is a LEAD?
- **Definition**: A prospective contact entering the business with unverified or preliminary interest.
- **Lifecycle**: Generated via marketing, walk-ins, or bulk upload. It exists to be "qualified" or "disqualified."
- **Data Shape**: Phone number, basic name, source, and initial property requirement (`LeadMatchingRequirement`).
- **End of Life**: A Lead is successfully "converted" when genuine commercial interest is established (or a site visit occurs), at which point a `Customer` and `Opportunity` should be generated.

## 2. What is a CUSTOMER?
- **Definition**: An identified person (or corporate entity) with an established, verified relationship with the business.
- **Lifecycle**: Created either when a Lead is converted, or directly entered for repeat business.
- **Data Shape**: Verified KYC details, PAN/Aadhaar (in India), permanent address, billing details.
- **Multiplicity**: A `Customer` persists indefinitely and can have *many* `Opportunities` over their lifetime.

## 3. What is an OPPORTUNITY?
- **Definition**: A specific commercial sales pipeline instance representing a potential deal.
- **Lifecycle**: Starts at qualification/negotiation, advances through site visits, and concludes in either `BOOKED`/`WON` or `LOST`.
- **Data Shape**: Expected revenue, target `Project` or `Unit`, probability to close, expected close date.
- **Multiplicity**: One `Lead` converts into one `Customer` and one initial `Opportunity`. If the customer returns 5 years later, a new `Opportunity` is created under the existing `Customer`.

## 4. Resolution of Existing Relationships
When transitioning to this target model:
- **LeadActivity**: Activities on a raw Lead stay with the Lead. Activities during negotiation belong to the `Opportunity`.
- **LeadPropertyInterest**: Migrates to become `OpportunityPropertyInterest`.
- **SiteVisitBooking**: Currently tied to `Lead`. It must migrate to tie to the `Opportunity`.

## 5. Tenancy & Ownership
All three entities inherit `company_id`. An Opportunity is explicitly assigned to a specific `Employee` (Sales Agent), just as a Lead currently is.
