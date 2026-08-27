# RRH-CRMS Repository Inventory

## Overview
This document serves as the high-level baseline inventory for the RRH-CRMS repository prior to the major CRM transformation.

## Project Structure
The repository is structured as a monolithic repository (monorepo) using npm workspaces.

```text
RRH PWA/
├── apps/
│   ├── api/                   # Backend Node.js/Express application
│   └── web/                   # Frontend React/Vite application
├── packages/
│   └── shared/                # Shared types, permissions, roles, constants
├── prisma/                    # Prisma ORM schema and migrations
│   └── schema.prisma          # Database source of truth
├── tests/                     # API and integration tests suite
├── docs/                      # Project documentation
├── scripts/                   # Build and utility scripts
├── package.json               # Root workspace configuration
└── tsconfig.json              # TypeScript configuration
```

## Workspaces
- **@rrh-ems/api**: Backend application (Express.js)
- **@rrh-ems/web**: Frontend application (React + Vite)
- **@rrh-ems/shared**: Shared utilities and types

## Core Technologies
- **Frontend**: React, Vite, TailwindCSS, React Router, Lucide React (Icons)
- **Backend**: Node.js, Express.js, Prisma (ORM), TypeScript
- **Database**: MySQL
- **Testing**: Jest, Playwright
- **Package Manager**: npm workspaces

## Existing Functional Domains (High-Level)
- **Authentication & Security**: JWT-based authentication with refresh token families, RBAC.
- **EMS / HR Foundation**: Employee management, roles, attendance, tasks, daily reports, notifications.
- **CRM & Sales Pipeline**: Leads, Lead matching requirements, Lead property interests, Site visits.
- **Inventory / Projects**: Properties, images, and property verification workflows.
- **Operations & Finance**: Channel partner management, payouts, expense refunds.
