# RRH-CRMS Booking & Payment Domain Boundaries

## Overview
This document defines the conceptual boundaries for the transactional phase of the real estate lifecycle. Currently, these entities do not exist in the repository.

## 1. Booking
- **Definition**: A legal and financial reservation of a specific physical Unit by a Customer.
- **Ownership**: Belongs to `Company` (Tenant), `Customer`, and `Opportunity`.
- **Relationship to Inventory**: A Booking MUST strictly lock a `Unit`. The `Unit` status moves to `BOOKED`.
- **Double-Booking Prevention**: The database schema must enforce a unique constraint on active bookings per Unit, and Prisma transactions must be used to atomically lock units during booking creation.
- **Relationship to CP**: If the Opportunity was sourced by a Channel Partner, the Booking triggers the logic to calculate `CPPayout` (Commission).

## 2. Payment Schedule
- **Definition**: The agreed timeline of milestone payments for a Booking (e.g., 20% down, 20% plinth level, etc.).
- **Ownership**: Belongs to `Booking`.

## 3. Payment (Receipt)
- **Definition**: A recorded transfer of funds from the Customer against the Booking.
- **Ownership**: Belongs to `Booking`.
- **State Changes**: Upon full clearance of the payment schedule, the Unit status transitions from `BOOKED` to `SOLD` or `HANDED_OVER`.

## 4. Refund / Cancellation
- **Definition**: The process of voiding a Booking and returning funds (partially or fully).
- **Side Effects**: Releases the `Unit` back to `AVAILABLE`. Subtracts or voids related `CPPayout` records depending on policy.
