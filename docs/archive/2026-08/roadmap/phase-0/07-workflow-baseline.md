# RRH-CRMS Workflow Baseline

## Overview
This document identifies the state machines and workflows currently implemented.

## 1. Lead Workflow
| Entity | Current State | Allowed Next States | Authorized Roles | Side Effects |
|--------|---------------|---------------------|------------------|--------------|
| Lead | `NEW` | `ASSIGNED` | Auto-assignment engine, MD | Triggers assignment logic |
| Lead | `ASSIGNED` | `CONTACTED`, `QUALIFIED` | Assigned Telecaller | Logs Activity |
| Lead | `QUALIFIED` | `SITE_VISIT_SCHEDULED` | System (on SV booking) | Updates SV tables |
| Lead | `SITE_VISIT_SCHEDULED` | `NEGOTIATION`, `WON`, `LOST` | Telecaller, PM | Logs Activity |
| Lead | `LOST` | `RECOVERED_TO_POOL` | MD, Managers | Re-enters assignment pool |

## 2. Site Visit Workflow
| Entity | Current State | Allowed Next States | Authorized Roles | Side Effects |
|--------|---------------|---------------------|------------------|--------------|
| SiteVisitBooking | (Creation) | `PENDING_VERIFICATION` | Telecaller | Connects Lead and Property |
| SiteVisitBooking | `PENDING_VERIFICATION`| `CONFIRMED`, `CANCELLED` | Telecaller, PM | Notes logged |
| SiteVisitBooking | `CONFIRMED` | `ASSIGNED_TO_AGENT`, `RESCHEDULED` | PM | Field Agent assigned |
| SiteVisitBooking | `ASSIGNED_TO_AGENT` | `COMPLETED` | PM | |
| SiteVisitBooking | `COMPLETED` | - | PM, Field Agent | Rating captured, Proof photo saved |

## 3. Property Verification Workflow
| Entity | Current State | Allowed Next States | Authorized Roles | Side Effects |
|--------|---------------|---------------------|------------------|--------------|
| Property | `PENDING_VERIFICATION`| `PENDING_DM_POLISH` | PM | Verification log created |
| Property | `PENDING_DM_POLISH` | `PENDING_MD_APPROVAL` | Digital Marketing | |
| Property | `PENDING_MD_APPROVAL` | `LIVE`, `REJECTED` | MD | Becomes visible to auto-matcher |

## 4. Expense Refund Workflow
| Entity | Current State | Allowed Next States | Authorized Roles | Side Effects |
|--------|---------------|---------------------|------------------|--------------|
| ExpenseRefund | `PENDING` | `ACCOUNTANT_APPROVED`, `REJECTED_BY_ACCOUNTANT`| Accountant | Note added |
| ExpenseRefund | `ACCOUNTANT_APPROVED` | `MD_APPROVED`, `REJECTED_BY_MD` | MD | Note added |
| ExpenseRefund | `MD_APPROVED` | `REFUNDED` | Accountant | Cash disbursed |
