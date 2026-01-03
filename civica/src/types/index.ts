export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  school_id?: string;
  office_id?: string;
  team_id?: string;
  is_active: boolean;
  created_at: string;
  grade?: string;
  school_name?: string;
  office_name?: string;
  team_name?: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  headmaster_id?: string;
  student_count: number;
  is_active: boolean;
  created_at: string;
  headmaster?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  team_count?: number;
  inspection_count?: number;
}

export interface Office {
  id: string;
  name: string;
  type: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  contact_person?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  inspection_count?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface Team {
  id: string;
  name: string;
  school_id: string;
  student_ids: string[];
  team_leader_id: string;
  is_active: boolean;
  created_at: string;
  school?: School;
  students?: User[];
  team_leader?: User;
  stats?: {
    total_inspections: number;
    completed_inspections: number;
    pending_inspections: number;
  };
}

export interface FormField {
  field_name: string;
  field_type: 'rating' | 'text' | 'multiline' | 'photo' | 'dropdown';
  is_required: boolean;
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  office_types: string[];
  form_fields: FormField[];
  is_active: boolean;
  created_at: string;
  created_by: string;
  usage_count?: number;
}

export interface Inspection {
  id: string;
  task_name: string;
  task_description: string;
  office_id: string;
  school_id: string;
  team_id: string;
  assigned_date: string;
  due_date: string;
  status: 'assigned' | 'submitted' | 'responded' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  template_id: string;
  created_at: string;
  office?: Office;
  school?: School;
  team?: Team;
  template?: Template;
  report?: any;
  office_response?: any;
  govt_review?: any;
}