export type Role = 'user' | 'rescuer' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  location?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type AnimalStatus = 'available' | 'pending' | 'adopted';
export type AnimalSex = 'male' | 'female' | 'unknown';
export type AnimalSize = 'small' | 'medium' | 'large';

export interface AnimalPhoto {
  id: number;
  path: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Animal {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  sex: AnimalSex;
  size: AnimalSize | null;
  age_months: number | null;
  description: string | null;
  status: AnimalStatus;
  vaccinated: boolean;
  sterilized: boolean;
  photos: AnimalPhoto[];
  primary_photo?: AnimalPhoto | null;
  created_by?: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export type StrayReportType = 'lost' | 'found' | 'injured';
export type StrayReportStatus = 'open' | 'resolved';

export interface StrayReportPhoto {
  id: number;
  path: string;
  url: string;
  sort_order: number;
}

export interface StrayReport {
  id: number;
  type: StrayReportType;
  species: string;
  breed: string | null;
  color: string | null;
  description: string;
  location: string;
  occurred_at: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  status: StrayReportStatus;
  photos: StrayReportPhoto[];
  reporter?: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface AdoptionApplication {
  id: number;
  status: ApplicationStatus;
  message: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  animal?: {
    id: number;
    name: string;
    species: string;
    status: AnimalStatus;
    primary_photo?: AnimalPhoto | null;
  } | null;
  applicant?: { id: number; name: string; email: string } | null;
  reviewer?: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminStats {
  users: { total: number; admins: number; rescuers: number; regular: number };
  animals: { total: number; available: number; pending: number; adopted: number };
  stray_reports: {
    total: number;
    lost: number;
    found: number;
    injured: number;
    open: number;
    resolved: number;
  };
  adoption_applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    withdrawn: number;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: unknown;
}
