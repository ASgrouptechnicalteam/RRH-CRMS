import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.number().int(),
  name: z.string().min(2),
  code: z.string(),
  property_type_group: z.enum(['RADHA_REAL_HOMES', 'SONTHILLU']),
});

export type Company = z.infer<typeof CompanySchema>;

// Roles
export const Roles = {
  MD: 'Managing director',
  ADMIN: 'Admin (Technical)',
  MARKETING_DIRECTOR: 'marketing director',
  PROJECT_MANAGER: 'project managers',
  DIGITAL_LEAD_OPERATOR: 'Digital lead operator',
  TELECALLER: 'telecallers',
  CHANNEL_PARTNER_MANAGER: 'channel partner manager',
  DIGITAL_MARKETING_HEAD: 'Digital Marketing head(manager)',
  HR_MANAGER: 'HR',
  FINANCE: 'accountant',
  AGENT: 'Agent',
  CHANNEL_PARTNER: 'channel partners',
  DIGITAL_MARKETING_EXECUTIVE: 'digital marketing executive'
} as const;

export type RoleName = typeof Roles[keyof typeof Roles];

// Permanent 2-Letter Department Codes for Employee IDs: RRH-{DEPT_2DIGIT}-{NUMBER_3DIGIT}
// Employee IDs remain static and permanent for life even when promoted!
export const DepartmentCodes: Record<string, string> = {
  [Roles.MD]: 'EX',
  [Roles.ADMIN]: 'EX',
  [Roles.HR_MANAGER]: 'HR',
  [Roles.TELECALLER]: 'SL',
  [Roles.CHANNEL_PARTNER_MANAGER]: 'SL',
  [Roles.AGENT]: 'SL',
  [Roles.CHANNEL_PARTNER]: 'CP',
  [Roles.PROJECT_MANAGER]: 'OP',
  [Roles.DIGITAL_MARKETING_EXECUTIVE]: 'MK',
  [Roles.DIGITAL_MARKETING_HEAD]: 'MK',
  [Roles.DIGITAL_LEAD_OPERATOR]: 'MK',
  [Roles.FINANCE]: 'FN',
  [Roles.MARKETING_DIRECTOR]: 'MK',
};

// Canonical Permissions Model (Phase 1 - Stage 2 Blueprint Section 7)
export const Permissions = {
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_READ: 'employees.read',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',
  EMPLOYEES_VIEW_SENSITIVE: 'employees.view_sensitive',
  EMPLOYEES_MANAGE_DEFAULT_ALL: 'employees.manage_default:all',
  EMPLOYEES_RESET_PASSWORD: 'employees.reset_password',
  
  LEADS_CREATE: 'leads.create',
  LEADS_READ: 'leads.read',
  LEADS_UPDATE: 'leads.update',
  LEADS_DELETE: 'leads.delete',
  LEADS_ASSIGN: 'leads.assign',
  LEADS_BULK_UPLOAD: 'leads.bulk_upload',
  LEADS_DISTRIBUTION_MONITOR: 'leads.distribution_monitor',
  LEADS_WHATSAPP_PROPOSAL: 'leads.whatsapp_proposal',
  
  PROPERTIES_CREATE: 'properties.create',
  PROPERTIES_READ: 'properties.read',
  PROPERTIES_UPDATE: 'properties.update',
  PROPERTIES_DELETE: 'properties.delete',
  PROPERTIES_VERIFY: 'properties.verify',
  PROPERTIES_DM_POLISH: 'properties.dm_polish',
  PROPERTIES_MD_APPROVE: 'properties.md_approve',
  
  SITE_VISITS_CREATE: 'site_visits.create',
  SITE_VISITS_READ: 'site_visits.read',
  SITE_VISITS_VERIFY: 'site_visits.verify',
  SITE_VISITS_ASSIGN_AGENT: 'site_visits.assign_agent',
  SITE_VISITS_COMPLETE: 'site_visits.complete',
  
  CHANNEL_PARTNERS_CREATE: 'channel_partners.create',
  CHANNEL_PARTNERS_READ: 'channel_partners.read',
  CHANNEL_PARTNERS_UPDATE: 'channel_partners.update',
  CHANNEL_PARTNERS_CALCULATE_COMMISSION: 'channel_partners.calculate_commission',
  CHANNEL_PARTNERS_PROTECT_LEAD: 'channel_partners.protect_lead',
  CHANNEL_PARTNERS_PAYOUTS_READ: 'channel_partners.payouts.read',
  CHANNEL_PARTNERS_PAYOUTS_APPROVE: 'channel_partners.payouts.approve',
  
  TASKS_CREATE: 'tasks.create',
  TASKS_READ: 'tasks.read',
  TASKS_UPDATE: 'tasks.update',
  TASKS_ASSIGN: 'tasks.assign',
  
  ATTENDANCE_READ_OWN: 'attendance.read_own',
  ATTENDANCE_SCAN: 'attendance.scan',
  ATTENDANCE_LATE_PROPOSAL: 'attendance.late_proposal',
  ATTENDANCE_LEAVE_PROPOSAL: 'attendance.leave_proposal',
  ATTENDANCE_PROPOSALS_QUEUE: 'attendance.proposals_queue',
  ATTENDANCE_LIVE_MONITOR: 'attendance.live_monitor',
  
  REPORTS_CREATE: 'reports.create',
  REPORTS_READ_OWN: 'reports.read_own',
  REPORTS_READ_TEAM: 'reports.read_team',
  REPORTS_TARGETS_CONFIGURE: 'reports.targets.configure',
  
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_READ_OWN: 'expenses.read_own',
  EXPENSES_REVIEW: 'expenses.review',
  EXPENSES_MD_APPROVE: 'expenses.md_approve',
  EXPENSES_MARK_REFUNDED: 'expenses.mark_refunded',
  
  PERFORMANCE_READ_OWN: 'performance.read_own',
  PERFORMANCE_READ_TEAM: 'performance.read_team',
  PERFORMANCE_HISTORY: 'performance.history',
  
  ADMIN_SYSTEM_METRICS: 'admin.system_metrics',
  ADMIN_AUDIT_LOGS: 'admin.audit_logs',
  ADMIN_SECURITY_ALERTS: 'admin.security_alerts',
  ADMIN_EMERGENCY_LOCKDOWN: 'admin.emergency_lockdown',
  
  PUBLIC_PROPERTIES_READ: 'public.properties.read',
  PUBLIC_LEADS_CREATE: 'public.leads.create',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

const ALL_PERMISSIONS = Object.values(Permissions);

// Role -> Permission Matrix (Phase 1 - Stage 2 Blueprint Section 8)
export const RolePermissionsMatrix: Record<RoleName, string[]> = {
  [Roles.MD]: ALL_PERMISSIONS, // MD gets all permissions
  
  [Roles.ADMIN]: [
    Permissions.ADMIN_SYSTEM_METRICS,
    Permissions.ADMIN_AUDIT_LOGS,
    Permissions.ADMIN_SECURITY_ALERTS,
    Permissions.ADMIN_EMERGENCY_LOCKDOWN,
    Permissions.EMPLOYEES_CREATE,
    Permissions.EMPLOYEES_READ,
    Permissions.EMPLOYEES_UPDATE,
    Permissions.EMPLOYEES_RESET_PASSWORD,
    // Explicitly NO EMPLOYEES_VIEW_SENSITIVE for ADMIN
  ],
  
  [Roles.HR_MANAGER]: [
    Permissions.EMPLOYEES_CREATE,
    Permissions.EMPLOYEES_READ,
    Permissions.EMPLOYEES_UPDATE,
    Permissions.EMPLOYEES_RESET_PASSWORD,
    Permissions.EMPLOYEES_VIEW_SENSITIVE,
    Permissions.ATTENDANCE_PROPOSALS_QUEUE,
    Permissions.ATTENDANCE_LIVE_MONITOR,
    Permissions.TASKS_CREATE,
    Permissions.TASKS_READ,
    Permissions.TASKS_UPDATE,
    Permissions.TASKS_ASSIGN,
    Permissions.REPORTS_READ_TEAM,
    Permissions.PERFORMANCE_READ_TEAM,
  ],
  
  [Roles.FINANCE]: [
    Permissions.EXPENSES_REVIEW,
    Permissions.EXPENSES_MARK_REFUNDED,
    Permissions.CHANNEL_PARTNERS_PAYOUTS_READ,
    Permissions.CHANNEL_PARTNERS_CALCULATE_COMMISSION,
    Permissions.EMPLOYEES_VIEW_SENSITIVE, // Finance receives authorized sensitive fields
  ],
  
  [Roles.MARKETING_DIRECTOR]: [
    Permissions.LEADS_CREATE,
    Permissions.LEADS_READ,
    Permissions.LEADS_UPDATE,
    Permissions.LEADS_DELETE,
    Permissions.LEADS_ASSIGN,
    Permissions.LEADS_BULK_UPLOAD,
    Permissions.PROPERTIES_DM_POLISH,
    Permissions.PROPERTIES_MD_APPROVE, // Per Section 8 participation
    Permissions.SITE_VISITS_READ,
    Permissions.REPORTS_TARGETS_CONFIGURE,
    Permissions.REPORTS_READ_TEAM,
    Permissions.PERFORMANCE_READ_TEAM,
    Permissions.CHANNEL_PARTNERS_READ,
  ],
  
  [Roles.PROJECT_MANAGER]: [
    Permissions.PROPERTIES_VERIFY,
    Permissions.PROPERTIES_READ,
    Permissions.SITE_VISITS_READ,
    Permissions.SITE_VISITS_ASSIGN_AGENT,
    Permissions.TASKS_CREATE,
    Permissions.TASKS_READ,
    Permissions.TASKS_UPDATE,
    Permissions.TASKS_ASSIGN,
    Permissions.LEADS_READ,
    Permissions.REPORTS_READ_OWN,
  ],
  
  [Roles.DIGITAL_LEAD_OPERATOR]: [
    Permissions.LEADS_CREATE,
    Permissions.LEADS_READ,
    Permissions.LEADS_UPDATE,
    Permissions.LEADS_ASSIGN,
    Permissions.LEADS_BULK_UPLOAD,
    Permissions.LEADS_DISTRIBUTION_MONITOR,
    Permissions.SITE_VISITS_CREATE,
    Permissions.SITE_VISITS_VERIFY,
    Permissions.CHANNEL_PARTNERS_READ,
    Permissions.REPORTS_TARGETS_CONFIGURE,
  ],
  
  [Roles.TELECALLER]: [
    Permissions.LEADS_READ,
    Permissions.LEADS_UPDATE,
    Permissions.LEADS_WHATSAPP_PROPOSAL,
    Permissions.SITE_VISITS_CREATE,
    Permissions.SITE_VISITS_READ,
    Permissions.TASKS_READ,
    Permissions.TASKS_UPDATE,
    Permissions.ATTENDANCE_READ_OWN,
    Permissions.ATTENDANCE_SCAN,
    Permissions.ATTENDANCE_LATE_PROPOSAL,
    Permissions.ATTENDANCE_LEAVE_PROPOSAL,
    Permissions.REPORTS_CREATE,
    Permissions.REPORTS_READ_OWN,
    Permissions.PERFORMANCE_READ_OWN,
  ],
  
  [Roles.CHANNEL_PARTNER_MANAGER]: [
    Permissions.CHANNEL_PARTNERS_CREATE,
    Permissions.CHANNEL_PARTNERS_READ,
    Permissions.CHANNEL_PARTNERS_UPDATE,
    Permissions.CHANNEL_PARTNERS_CALCULATE_COMMISSION,
    Permissions.CHANNEL_PARTNERS_PROTECT_LEAD,
    Permissions.CHANNEL_PARTNERS_PAYOUTS_READ,
    Permissions.PERFORMANCE_READ_TEAM,
  ],
  
  [Roles.DIGITAL_MARKETING_HEAD]: [
    Permissions.PROPERTIES_DM_POLISH,
    Permissions.PROPERTIES_READ,
    Permissions.LEADS_READ,
    Permissions.REPORTS_TARGETS_CONFIGURE,
    Permissions.PERFORMANCE_READ_TEAM,
  ],
  
  [Roles.AGENT]: [
    Permissions.SITE_VISITS_READ,
    Permissions.SITE_VISITS_COMPLETE,
    Permissions.TASKS_READ,
    Permissions.TASKS_UPDATE,
    Permissions.ATTENDANCE_READ_OWN,
    Permissions.ATTENDANCE_SCAN,
    Permissions.REPORTS_CREATE,
    Permissions.REPORTS_READ_OWN,
    Permissions.PERFORMANCE_READ_OWN,
  ],
  
  [Roles.CHANNEL_PARTNER]: [
    Permissions.CHANNEL_PARTNERS_READ,
    Permissions.CHANNEL_PARTNERS_PAYOUTS_READ,
    Permissions.LEADS_READ,
    Permissions.SITE_VISITS_READ,
  ],
  
  [Roles.DIGITAL_MARKETING_EXECUTIVE]: [
    Permissions.LEADS_READ,
    Permissions.LEADS_UPDATE,
    Permissions.SITE_VISITS_READ,
    Permissions.TASKS_READ,
    Permissions.TASKS_UPDATE,
    Permissions.REPORTS_CREATE,
    Permissions.REPORTS_READ_OWN,
    Permissions.ATTENDANCE_READ_OWN,
    Permissions.ATTENDANCE_SCAN,
    Permissions.PERFORMANCE_READ_OWN,
  ]
};

// Employee Code Regex: e.g. RRH-EX-001 (MD), RRH-EX-002 (Admin), RRH-HR-001 (HR), RRH-SL-001 (Sales/Telecaller)
export const EMPLOYEE_CODE_REGEX = /^RRH-[A-Z]{2,5}-\d{3,5}$/;


// Login Request Schema
export const LoginSchema = z.object({
  employee_code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Employee ID is required')
    .regex(
      EMPLOYEE_CODE_REGEX,
      'Invalid Employee ID format. Expected format: RRH-XX-000'
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Attendance Status
export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  APPROVED_LATE: 'APPROVED_LATE',
  HALF_DAY: 'HALF_DAY',
  APPROVED_HALF_DAY: 'APPROVED_HALF_DAY',
  ABSENT: 'ABSENT',
  LEAVE: 'LEAVE',
} as const;

export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];

// Password Change Schema (Forced first login)
export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// Late Proposal Schema (< 09:30 AM IST)
export const LateProposalSchema = z.object({
  date: z.string().min(1, 'Date is required'), // YYYY-MM-DD
  expected_time: z.string().min(1, 'Expected arrival time is required'), // HH:mm
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type LateProposalInput = z.infer<typeof LateProposalSchema>;

// Leave Proposal Schema (>= 1 day advance)
export const LeaveProposalSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type LeaveProposalInput = z.infer<typeof LeaveProposalSchema>;

// Task Constants
export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

// Daily Report Schema (with 15-character minimum below_target_reason check)
export const DailyReportSchema = z.object({
  role_name: z.string().min(1),
  metrics: z.record(z.any()), // Role-specific key-value pairs (e.g. callsMade, siteVisits)
  summary_notes: z.string().min(5, 'Summary notes must be at least 5 characters'),
  below_target_reason: z
    .string()
    .min(15, 'Reason for missing target must be at least 15 characters long')
    .optional()
    .or(z.literal(''))
    .or(z.null()),
});

export type DailyReportInput = z.infer<typeof DailyReportSchema>;

// Daily Target Set Schema (for MD & Marketing Director Target Configurator)
export const DailyTargetSetSchema = z.object({
  role_name: z.string().min(1),
  employee_id: z.number().int().optional().nullable(),
  target_type: z.enum(['COUNT', 'CHECKLIST']),
  targets_json: z.record(z.any()),
  form_schema_json: z.array(z.any()).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
});

export type DailyTargetSetInput = z.infer<typeof DailyTargetSetSchema>;

// Task Create Schema
export const TaskCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  assignee_id: z.number().int().positive(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  deadline: z.string().min(1, 'Deadline date/time is required'),
});

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;

// Task Status Update Schema
export const TaskUpdateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
});

export type TaskUpdateStatusInput = z.infer<typeof TaskUpdateStatusSchema>;

// Lead Constants & Schemas
export const LeadStatus = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  SITE_VISIT_SCHEDULED: 'SITE_VISIT_SCHEDULED',
  NEGOTIATION: 'NEGOTIATION',
  WON: 'WON',
  LOST: 'LOST',
  RECOVERED_TO_POOL: 'RECOVERED_TO_POOL',
} as const;

export type LeadStatusType = typeof LeadStatus[keyof typeof LeadStatus];

export const LeadSource = {
  MANUAL_ENTRY: 'MANUAL_ENTRY',
  BULK_UPLOAD: 'BULK_UPLOAD',
  WEBSITE: 'WEBSITE',
  FACEBOOK_ADS: 'FACEBOOK_ADS',
  GOOGLE_ADS: 'GOOGLE_ADS',
  WALK_IN: 'WALK_IN',
  REFERRAL: 'REFERRAL',
} as const;

export const LeadCreateSchema = z.object({
  customer_name: z.string().min(2, 'Customer name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  source: z.string().default('MANUAL_ENTRY'),
  property_type_preference: z.string().optional(),
  budget_min: z.number().optional().nullable(),
  budget_max: z.number().optional().nullable(),
  preferred_location: z.string().optional(),
  notes: z.string().optional(),
});

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;

export const LeadStatusUpdateSchema = z.object({
  status: z.enum([
    'NEW',
    'ASSIGNED',
    'CONTACTED',
    'QUALIFIED',
    'SITE_VISIT_SCHEDULED',
    'NEGOTIATION',
    'WON',
    'LOST',
    'RECOVERED_TO_POOL',
  ]),
  notes: z.string().optional(),
});

export type LeadStatusUpdateInput = z.infer<typeof LeadStatusUpdateSchema>;

export const LeadReassignSchema = z.object({
  assigned_to_id: z.number().int().positive('Assignee ID is required'),
  reason: z.string().min(3, 'Reassignment reason is required'),
});

export type LeadReassignInput = z.infer<typeof LeadReassignSchema>;

// Property Constants & Schemas
export const PropertyStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  PENDING_DM_POLISH: 'PENDING_DM_POLISH',
  PENDING_MD_APPROVAL: 'PENDING_MD_APPROVAL',
  LIVE: 'LIVE',
  REJECTED: 'REJECTED',
} as const;

export type PropertyStatusType = typeof PropertyStatus[keyof typeof PropertyStatus];

export const PropertyBrand = {
  SONTHILLU: 'SONTHILLU', // Residential Villas & Apartments
  RADHA_REAL_HOMES: 'RADHA_REAL_HOMES', // Commercial Plots & Land
} as const;

export const PropertyCreateSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  brand_type: z.enum(['SONTHILLU', 'RADHA_REAL_HOMES']),
  category: z.enum([
    'APARTMENT', 'INDEPENDENT_HOUSE', 'DUPLEX', 'INDEPENDENT_FLOOR', 
    'VILLA', 'PENTHOUSE', 'STUDIO', 'PLOT', 'FARM_HOUSE', 'AGRICULTURAL_LAND'
  ]),
  price: z.number().positive('Price must be greater than 0'),
  area_sqft: z.number().positive('Area in sqft is required'),
  location: z.string().min(2, 'Location is required'),
  address: z.string().optional(),
  bedrooms: z.number().int().optional().nullable(),
  bathrooms: z.number().int().optional().nullable(),
  facing: z.string().optional(),
  amenities: z.string().optional(),
  possession_status: z.enum(['READY_TO_MOVE', 'UNDER_CONSTRUCTION']).optional(),
  assigned_pm_id: z.number().int().optional().nullable(),
  details: z.any().optional(), // Flexible JSON payload for specific property details
});

export type PropertyCreateInput = z.infer<typeof PropertyCreateSchema>;

export const PropertyVerificationSchema = z.object({
  approved: z.boolean(),
  notes: z.string().min(3, 'Verification notes required'),
  assigned_pm_id: z.number().int().optional(),
});

export type PropertyVerificationInput = z.infer<typeof PropertyVerificationSchema>;

export const PropertyDMUpdateSchema = z.object({
  seo_title: z.string().optional(),
  seo_keywords: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export type PropertyDMUpdateInput = z.infer<typeof PropertyDMUpdateSchema>;

export const PropertyMDApprovalSchema = z.object({
  approved: z.boolean(),
  comments: z.string().optional(),
});

export type PropertyMDApprovalInput = z.infer<typeof PropertyMDApprovalSchema>;

// Channel Partner & Incentive Constants
export const CPTier = {
  SILVER: 'SILVER', // 2.0% Base Rate
  GOLD: 'GOLD', // 2.5% Rate
  PLATINUM: 'PLATINUM', // 3.0% Top Rate
} as const;

export const CPTierRates: Record<string, number> = {
  SILVER: 2.0,
  GOLD: 2.5,
  PLATINUM: 3.0,
};

export const CPOverrideRate = 0.5; // Level 2 Upline Override Rate %

export const CPCreateSchema = z.object({
  firm_name: z.string().min(2, 'Firm name is required'),
  contact_name: z.string().min(2, 'Contact person name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email().optional().or(z.literal('')),
  tier: z.enum(['SILVER', 'GOLD', 'PLATINUM']).default('SILVER'),
  upline_cp_id: z.number().int().optional().nullable(),
  rera_number: z.string().optional(),
  pan_number: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
});

export type CPCreateInput = z.infer<typeof CPCreateSchema>;

export const CPCommissionCalculateSchema = z.object({
  cp_id: z.number().int().positive('Channel Partner ID is required'),
  deal_amount: z.number().positive('Deal amount must be greater than 0'),
  property_id: z.number().int().optional(),
  lead_id: z.number().int().optional(),
});

export type CPCommissionCalculateInput = z.infer<typeof CPCommissionCalculateSchema>;







