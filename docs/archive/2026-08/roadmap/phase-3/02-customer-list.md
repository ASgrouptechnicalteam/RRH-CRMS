# Customer List Documentation

## Pattern
The Customer List was implemented in `CustomerManagement.tsx` mimicking the UX established by `LeadManagement.tsx`.

## Features
- **Data Columns**: Customer Code, Name, Phone, Email, Status, Assigned Employee.
- **States Handled**: Loading spinner, Empty state message, and Error toasts via `ToastContext`.
- **Authorization**: Protected via `user?.permissions?.includes(Permissions.CUSTOMERS_READ)`. If false, a custom "Access Denied" view is rendered.
