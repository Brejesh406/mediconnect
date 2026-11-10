export type UserRole = 'patient' | 'doctor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  patient?: PatientData;
  doctor?: DoctorData;
  createdAt?: string;
}

export interface PatientData {
  id: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
  allergies?: string;
  chronic_conditions?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

export interface DoctorData {
  id: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  title: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  consultation_fee: number;
  room_number: string;
  bio?: string;
  image_url?: string;
}

export interface DoctorListItem {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  department_id: string;
  department_name: string;
  department_code: string;
  title: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  consultation_fee: number;
  room_number: string;
  bio?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  head_doctor_name?: string;
  location_floor?: string;
  doctor_count?: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason_for_visit: string;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  patient_blood_group?: string;
  doctor_name?: string;
  doctor_title?: string;
  doctor_specialization?: string;
  doctor_room?: string;
  consultation_fee?: number;
  department_name?: string;
  department_code?: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string | null;
  record_date: string;
  diagnosis: string;
  symptoms: string;
  clinical_notes: string;
  treatment_plan: string;
  follow_up_date?: string | null;
  vitals_blood_pressure?: string | null;
  vitals_heart_rate?: number | null;
  vitals_temperature?: number | null;
  vitals_spo2?: number | null;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_email?: string;
  blood_group?: string;
  doctor_name?: string;
  doctor_title?: string;
  specialization?: string;
  department_name?: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  record_id?: string | null;
  patient_id: string;
  doctor_id: string;
  issued_date: string;
  status: 'active' | 'completed' | 'discontinued';
  instructions?: string;
  patient_name?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  items: PrescriptionItem[];
}

export interface MedicalDocument {
  id: string;
  patient_id: string;
  uploaded_by: string;
  title: string;
  document_type: 'lab_result' | 'radiology' | 'discharge_summary' | 'insurance' | 'prescription_scan' | 'other';
  file_name: string;
  file_size: number;
  mime_type: string;
  notes?: string | null;
  created_at: string;
  uploader_name?: string;
  uploader_role?: string;
  patient_name?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'system' | 'record';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email: string;
  role: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  ip_address?: string;
  details?: string;
  created_at: string;
}

export interface AdminAnalytics {
  metrics: {
    totalPatients: number;
    totalDoctors: number;
    totalDepartments: number;
    totalAppointments: number;
    totalRecords: number;
    totalPrescriptions: number;
    totalRevenue: number;
  };
  statusCounts: { status: AppointmentStatus; count: number }[];
  departmentStats: {
    name: string;
    code: string;
    doctor_count: number;
    appointment_count: number;
  }[];
  recentActivities: {
    id: string;
    user_email: string;
    role: string;
    action: string;
    resource_type: string;
    details: string;
    created_at: string;
  }[];
}
