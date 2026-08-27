# Phase 5 Conceptual Schema & Migration Strategy

## 1. Schema Changes
To support the approved architecture, the following modifications will be made to the Prisma schema:

### New Model: Project
```prisma
model Project {
  id               Int       @id @default(autoincrement())
  project_code     String    @unique
  company_id       Int
  branch_id        Int?
  name             String
  description      String?   @db.Text
  location         String
  total_area       String?
  launch_date      DateTime?
  status           String    @default("PLANNING") // PLANNING, UNDER_CONSTRUCTION, COMPLETED, CANCELLED
  amenities        Json?     // Array of amenities
  assigned_pm_id   Int?
  
  company          Company   @relation(fields: [company_id], references: [id])
  branch           Branch?   @relation(fields: [branch_id], references: [id])
  assigned_pm      Employee? @relation("AssignedPMProjects", fields: [assigned_pm_id], references: [id])
  
  properties       Property[]
  
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  @@index([company_id])
  @@index([assigned_pm_id])
}
```

### Modified Model: Property (Unit)
```prisma
model Property {
  // ... existing fields ...
  project_id       Int?      // NULL means it is a standalone property

  project          Project?  @relation(fields: [project_id], references: [id])
  
  // ... existing relations ...

  @@index([project_id])
}
```

### Modified Model: Employee
```prisma
model Employee {
  // ... existing fields ...
  assigned_projects  Project[]  @relation("AssignedPMProjects")
}
```

## 2. API Changes
1. **`GET /api/v1/projects`**: List projects (scoped by company/role).
2. **`POST /api/v1/projects`**: Create a project (MD/Admin).
3. **`GET /api/v1/projects/:id`**: View project details and aggregated properties.
4. **`PUT /api/v1/projects/:id`**: Update project details.
5. **`GET /api/v1/properties`**: Accept an optional `?projectId=X` filter query parameter.
6. **`POST /api/v1/properties`**: Accept an optional `project_id` payload to link newly created properties directly to a project.

## 3. Frontend Changes
1. **Project Management Interface**: A new view for MDs and PMs to define and manage Projects.
2. **Property Form Updates**: The existing "Add Property" wizard must include an optional "Assign to Project" dropdown.
3. **Property Dossier Updates**: If a property belongs to a project, display a "Part of [Project Name]" badge in the UI.

## 4. Migration Order
1. Generate Prisma Client and deploy database migrations (`npx prisma migrate dev`).
2. Implement backend `Project` model CRUD services and controllers.
3. Add `project_id` handling to the existing `PropertyService`.
4. Update `ProjectManager` RBAC and Data Scope policies.
5. Implement frontend Project Management screens and update Property forms.
6. Validate all existing test suites.

## 5. Rollback Strategy
- The migration introduces a new table (`Project`) and a nullable foreign key (`project_id` on `Property`).
- Reverting the migration drops the `Project` table and the column, leaving existing `Property` records perfectly intact as standalone properties.
- This represents a highly safe, non-destructive migration.
