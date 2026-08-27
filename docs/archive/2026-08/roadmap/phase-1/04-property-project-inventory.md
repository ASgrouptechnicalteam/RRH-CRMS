# RRH-CRMS Property, Project & Inventory Analysis

## Overview
This document analyzes the current `Property` model and defines the target hierarchical inventory structure required for a robust real estate CRM.

## 1. Current State (`Property`)
- **What it is**: Currently, `Property` acts as a flattened record representing an individual saleable asset (e.g., a specific Villa or Plot).
- **Attributes**: Holds global data (location, brand_type) mixed with unit-specific data (price, area, bedrooms, facing).
- **Flaws**: 
  - There is no grouping mechanism. If a company launches "Sonthillu Phase 1" with 100 identical plots, they must create 100 detached `Property` records.
  - Updating project-wide amenities requires updating 100 individual records.
  - Hard to represent "Available vs Booked" state without overloading the property status.

## 2. Target Conceptual Model

To support scale, the inventory must become hierarchical:

### A. Project (New Entity)
- **Definition**: A distinct real estate development or major phase.
- **Attributes**: Name, geographical location, global amenities, RERA registration number, master plan media, launch date.
- **Ownership**: Belongs to `Company`.

### B. Block / Tower / Phase (Optional Grouping)
- **Definition**: Sub-divisions within a Project.

### C. Unit (The actual saleable inventory)
- **Definition**: The specific plot, villa, or apartment (e.g., "Villa 104", "Plot A-12").
- **Attributes**: Area, base price, premium charges (corner, east-facing), exact dimensions.
- **Lifecycle Status**: `AVAILABLE`, `BLOCKED` (temporary hold), `BOOKED` (deposit paid), `SOLD`, `HANDED_OVER`.

## 3. Migration Strategy for existing `Property`
- **Immediate Term**: Do not delete `Property`. 
- **Transition**: Rename `Property` to `Unit` conceptually. Introduce a `Project` table. Add a `project_id` foreign key to `Property`. 
- **Legacy Properties**: Existing properties that are standalone (e.g., secondary market sales) can belong to a generic "Standalone Listings" `Project` to satisfy the schema relationship, or `project_id` can be nullable.
