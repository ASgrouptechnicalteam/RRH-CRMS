export interface Project {
  id: number;
  project_code: string;
  name: string;
  description: string | null;
  location: string;
  total_area: string | null;
  launch_date: string | null;
  status: string;
  amenities: string[] | null;
  created_at: string;
}

export interface ProjectReference {
  id: number;
  project_code: string;
  name: string;
  location: string;
  status: string;
}

export type ProjectStatus = 'PLANNING' | 'UNDER_CONSTRUCTION' | 'COMPLETED' | 'CANCELLED';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
