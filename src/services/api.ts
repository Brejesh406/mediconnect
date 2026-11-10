import { 
  UserProfile, 
  DoctorListItem, 
  Department, 
  Appointment, 
  MedicalRecord, 
  Prescription, 
  MedicalDocument, 
  NotificationItem, 
  AdminAnalytics, 
  AuditLog,
  UserRole 
} from '../types';

const TOKEN_KEY = 'mediconnect_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => 
    request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string) => 
    request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  demoLogin: (targetRole: UserRole) => 
    request<{ token: string; user: UserProfile }>(`/api/auth/demo-login/${targetRole}`, {
      method: 'POST',
    }),

  firebaseLogin: (payload: { email: string; uid: string; fullName: string; avatarUrl?: string | null }) =>
    request<{ token: string; user: UserProfile }>('/api/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => 
    request<{ user: UserProfile }>('/api/auth/me'),

  logout: () => 
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) => 
    request<{ message: string; debugToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, newPassword: string) => 
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),

  updateProfile: (payload: any) => 
    request<{ success: boolean; message: string }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Departments
  getDepartments: () => 
    request<{ departments: Department[] }>('/api/departments'),

  createDepartment: (dept: Partial<Department>) => 
    request<{ id: string; message: string }>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    }),

  // Doctors
  getDoctors: () => 
    request<{ doctors: DoctorListItem[] }>('/api/doctors'),

  getDoctor: (id: string) => 
    request<{ doctor: DoctorListItem; availability: any[] }>(`/api/doctors/${id}`),

  getDoctorAvailability: (id: string) => 
    request<{ availability: any[] }>(`/api/doctors/${id}/availability`),

  updateDoctorAvailability: (id: string, schedules: any[]) => 
    request<{ success: boolean; message: string }>(`/api/doctors/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ schedules }),
    }),

  // Patients
  getPatients: () => 
    request<{ patients: any[] }>('/api/patients'),

  getPatientDetail: (id: string) => 
    request<{ 
      patient: any; 
      records: MedicalRecord[]; 
      prescriptions: Prescription[]; 
      documents: MedicalDocument[] 
    }>(`/api/patients/${id}`),

  // Appointments
  getAppointments: (params?: { status?: string; date?: string; doctorId?: string; patientId?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<{ appointments: Appointment[] }>(`/api/appointments${search ? `?${search}` : ''}`);
  },

  getAvailableSlots: (doctorId: string, date: string) => 
    request<{ slots: { startTime: string; endTime: string; isAvailable: boolean }[]; message?: string }>(
      `/api/appointments/available-slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`
    ),

  bookAppointment: (payload: {
    doctorId: string;
    departmentId?: string;
    appointmentDate: string;
    startTime: string;
    endTime?: string;
    reasonForVisit: string;
    patientId?: string;
  }) => 
    request<{ id: string; message: string; appointment: Appointment }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAppointmentStatus: (id: string, status: string, cancellationReason?: string) => 
    request<{ success: boolean; message: string }>(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellationReason }),
    }),

  rescheduleAppointment: (id: string, newDate: string, newStartTime: string) => 
    request<{ success: boolean; message: string }>(`/api/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ newDate, newStartTime }),
    }),

  // Medical Records
  getMedicalRecords: (patientId?: string) => 
    request<{ records: MedicalRecord[] }>(`/api/medical-records${patientId ? `?patientId=${patientId}` : ''}`),

  createMedicalRecord: (payload: {
    patientId: string;
    appointmentId?: string;
    diagnosis: string;
    symptoms: string;
    clinicalNotes: string;
    treatmentPlan: string;
    followUpDate?: string;
    vitalsBloodPressure?: string;
    vitalsHeartRate?: number;
    vitalsTemperature?: number;
    vitalsSpo2?: number;
    prescriptions?: {
      medicationName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
  }) => 
    request<{ success: boolean; recordId: string; message: string }>('/api/medical-records', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Prescriptions
  getPrescriptions: (patientId?: string) => 
    request<{ prescriptions: Prescription[] }>(`/api/prescriptions${patientId ? `?patientId=${patientId}` : ''}`),

  createPrescription: (payload: {
    patientId: string;
    recordId?: string;
    instructions?: string;
    items: {
      medicationName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
  }) => 
    request<{ id: string; message: string }>('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Documents
  getDocuments: (patientId?: string) => 
    request<{ documents: MedicalDocument[] }>(`/api/documents${patientId ? `?patientId=${patientId}` : ''}`),

  uploadDocument: (payload: {
    title: string;
    documentType: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileData: string;
    notes?: string;
    patientId?: string;
  }) => 
    request<{ id: string; message: string }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteDocument: (id: string) => 
    request<{ success: boolean; message: string }>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),

  // Notifications
  getNotifications: () => 
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),

  markNotificationRead: (id: string) => 
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () => 
    request<{ success: boolean; message: string }>('/api/notifications/mark-all-read', {
      method: 'POST',
    }),

  // Admin & Analytics
  getAdminAnalytics: () => 
    request<AdminAnalytics>('/api/admin/analytics'),

  getAuditLogs: (params?: { action?: string; role?: string; limit?: number }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<{ logs: AuditLog[] }>(`/api/admin/audit-logs${search ? `?${search}` : ''}`);
  },

  updateUserRole: (userId: string, newRole: UserRole) => 
    request<{ success: boolean; message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ newRole }),
    }),
};
