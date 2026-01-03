// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'headmaster' | 'student' | 'office' | 'responder';
  school_id?: string;
  team_id?: string;
  grade?: string;
  profile_image?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  school_id?: string;
  grade?: string;
}

// School types
export interface School {
  id: string;
  name: string;
  district?: string;
  state?: string;
}

// Inspection types
export interface Office {
  _id: string;
  name: string;
  type: 'mro' | 'municipality' | 'hospital' | 'police' | 'other';
  address: string;
  district: string;
  state: string;
  contact_person: string;
  contact_phone: string;
}

export interface Inspection {
  _id: string;
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
  office?: Office;
  report?: InspectionReport;
}

export interface InspectionReport {
  cleanliness_rating: number;
  staff_behavior_rating: number;
  service_quality_rating: number;
  issues: string;
  complaints: string;
  suggestions: string;
  photos: string[];
  submitted_at: string;
  submitted_by: string;
}

export interface InspectionSubmitData {
  cleanliness_rating: number;
  staff_behavior_rating: number;
  service_quality_rating: number;
  issues: string;
  complaints: string;
  suggestions: string;
  photos: string[];
}

// Notification types
export interface Notification {
  _id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'new_assignment' | 'response' | 'reminder' | 'announcement';
  related_inspection_id?: string;
  is_read: boolean;
  created_at: string;
}

// Stats types
export interface UserStats {
  total_inspections: number;
  completed_inspections: number;
  pending_inspections: number;
  success_rate: number;
}
