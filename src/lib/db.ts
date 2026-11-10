import { z } from 'zod';
import { 
  collection, 
  CollectionReference, 
  FirestoreDataConverter, 
  QueryDocumentSnapshot, 
  SnapshotOptions 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firestore Collection Names
 */
export const COLLECTIONS = {
  APPOINTMENTS: 'appointments',
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
  MEDICAL_RECORDS: 'medical_records',
} as const;

export const APPOINTMENTS_COLLECTION = COLLECTIONS.APPOINTMENTS;
export const PATIENTS_COLLECTION = COLLECTIONS.PATIENTS;
export const DOCTORS_COLLECTION = COLLECTIONS.DOCTORS;
export const MEDICAL_RECORDS_COLLECTION = COLLECTIONS.MEDICAL_RECORDS;

// ==========================================
// 1. PATIENT SCHEMAS & TYPES
// ==========================================

export const PatientSchema = z.object({
  id: z.string().min(1, 'Patient ID is required').max(128),
  userId: z.string().max(128).optional(),
  dateOfBirth: z.string().max(30).optional(),
  date_of_birth: z.string().max(30).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).or(z.string().max(30)).optional(),
  bloodGroup: z.string().max(10).optional(),
  blood_group: z.string().max(10).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergency_contact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(30).optional(),
  emergency_phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  allergies: z.string().max(500).optional(),
  chronicConditions: z.string().max(500).optional(),
  chronic_conditions: z.string().max(500).optional(),
  insuranceProvider: z.string().max(100).optional(),
  insurance_provider: z.string().max(100).optional(),
  insurancePolicyNumber: z.string().max(50).optional(),
  insurance_policy_number: z.string().max(50).optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

export const PatientInputSchema = PatientSchema.omit({ id: true }).partial();

export type PatientDocument = z.infer<typeof PatientSchema>;
export type PatientInput = z.infer<typeof PatientInputSchema>;

// ==========================================
// 2. DOCTOR SCHEMAS & TYPES
// ==========================================

export const DoctorSchema = z.object({
  id: z.string().min(1, 'Doctor ID is required').max(128),
  userId: z.string().max(128).optional(),
  departmentId: z.string().min(1, 'Department ID is required').max(64),
  department_id: z.string().max(64).optional(),
  title: z.string().min(1, 'Doctor title is required').max(100),
  specialization: z.string().min(1, 'Specialization is required').max(100),
  qualifications: z.string().max(200).optional().default(''),
  experienceYears: z.number().int().nonnegative().optional().default(0),
  experience_years: z.number().int().nonnegative().optional(),
  consultationFee: z.number().nonnegative().optional().default(0),
  consultation_fee: z.number().nonnegative().optional(),
  roomNumber: z.string().max(30).optional().default(''),
  room_number: z.string().max(30).optional(),
  bio: z.string().max(1000).optional().default(''),
  imageUrl: z.string().url().or(z.string()).optional(),
  image_url: z.string().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

export const DoctorInputSchema = DoctorSchema.omit({ id: true });

export type DoctorDocument = z.infer<typeof DoctorSchema>;
export type DoctorInput = z.infer<typeof DoctorInputSchema>;

// ==========================================
// 3. APPOINTMENT SCHEMAS & TYPES
// ==========================================

export const AppointmentStatusEnum = z.enum([
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'rejected',
]);

export const AppointmentSchema = z.object({
  id: z.string().min(1, 'Appointment ID is required').max(128),
  patientId: z.string().min(1, 'Patient ID is required').max(128),
  patient_id: z.string().max(128).optional(),
  doctorId: z.string().min(1, 'Doctor ID is required').max(128),
  doctor_id: z.string().max(128).optional(),
  departmentId: z.string().max(64).optional(),
  department_id: z.string().max(64).optional(),
  appointmentDate: z.string().min(1, 'Appointment date is required').max(20),
  appointment_date: z.string().max(20).optional(),
  startTime: z.string().min(1, 'Start time is required').max(10),
  start_time: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
  end_time: z.string().max(10).optional(),
  status: AppointmentStatusEnum.default('pending'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required').max(500),
  reason_for_visit: z.string().max(500).optional(),
  cancellationReason: z.string().max(500).nullable().optional(),
  cancellation_reason: z.string().max(500).nullable().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

export const AppointmentInputSchema = AppointmentSchema.omit({ id: true });

export type AppointmentDocument = z.infer<typeof AppointmentSchema>;
export type AppointmentInput = z.infer<typeof AppointmentInputSchema>;
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;

// ==========================================
// 4. MEDICAL RECORD SCHEMAS & TYPES
// ==========================================

export const MedicalRecordSchema = z.object({
  id: z.string().min(1, 'Medical Record ID is required').max(128),
  patientId: z.string().min(1, 'Patient ID is required').max(128),
  patient_id: z.string().max(128).optional(),
  doctorId: z.string().min(1, 'Doctor ID is required').max(128),
  doctor_id: z.string().max(128).optional(),
  appointmentId: z.string().max(128).nullable().optional(),
  appointment_id: z.string().max(128).nullable().optional(),
  recordDate: z.string().min(1, 'Record date is required').max(20),
  record_date: z.string().max(20).optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required').max(200),
  symptoms: z.string().max(500).optional().default(''),
  clinicalNotes: z.string().max(2000).optional().default(''),
  clinical_notes: z.string().max(2000).optional(),
  treatmentPlan: z.string().max(1000).optional().default(''),
  treatment_plan: z.string().max(1000).optional(),
  followUpDate: z.string().max(20).nullable().optional(),
  follow_up_date: z.string().max(20).nullable().optional(),
  vitalsBloodPressure: z.string().max(30).nullable().optional(),
  vitals_blood_pressure: z.string().max(30).nullable().optional(),
  vitalsHeartRate: z.number().int().nonnegative().nullable().optional(),
  vitals_heart_rate: z.number().int().nonnegative().nullable().optional(),
  vitalsTemperature: z.number().nonnegative().nullable().optional(),
  vitals_temperature: z.number().nonnegative().nullable().optional(),
  vitalsSpo2: z.number().int().min(0).max(100).nullable().optional(),
  vitals_spo2: z.number().int().min(0).max(100).nullable().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

export const MedicalRecordInputSchema = MedicalRecordSchema.omit({ id: true });

export type MedicalRecordDocument = z.infer<typeof MedicalRecordSchema>;
export type MedicalRecordInput = z.infer<typeof MedicalRecordInputSchema>;

// ==========================================
// 5. FIRESTORE DATA CONVERTERS
// ==========================================

export function createFirestoreConverter<T extends { id: string }>(
  schema: z.ZodType<T>
): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: T) {
      return schema.parse(modelObject);
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): T {
      const data = snapshot.data(options);
      return schema.parse({ ...data, id: snapshot.id });
    },
  };
}

export const patientConverter = createFirestoreConverter(PatientSchema);
export const doctorConverter = createFirestoreConverter(DoctorSchema);
export const appointmentConverter = createFirestoreConverter(AppointmentSchema);
export const medicalRecordConverter = createFirestoreConverter(MedicalRecordSchema);

// ==========================================
// 6. TYPED FIRESTORE COLLECTION FACTORIES
// ==========================================

export function getPatientsCollection(): CollectionReference<PatientDocument> {
  return collection(db, COLLECTIONS.PATIENTS).withConverter(patientConverter);
}

export function getDoctorsCollection(): CollectionReference<DoctorDocument> {
  return collection(db, COLLECTIONS.DOCTORS).withConverter(doctorConverter);
}

export function getAppointmentsCollection(): CollectionReference<AppointmentDocument> {
  return collection(db, COLLECTIONS.APPOINTMENTS).withConverter(appointmentConverter);
}

export function getMedicalRecordsCollection(): CollectionReference<MedicalRecordDocument> {
  return collection(db, COLLECTIONS.MEDICAL_RECORDS).withConverter(medicalRecordConverter);
}

// ==========================================
// 7. RUNTIME VALIDATION HELPERS
// ==========================================

export function validatePatient(data: unknown): PatientDocument {
  return PatientSchema.parse(data);
}

export function safeValidatePatient(data: unknown) {
  return PatientSchema.safeParse(data);
}

export function validateDoctor(data: unknown): DoctorDocument {
  return DoctorSchema.parse(data);
}

export function safeValidateDoctor(data: unknown) {
  return DoctorSchema.safeParse(data);
}

export function validateAppointment(data: unknown): AppointmentDocument {
  return AppointmentSchema.parse(data);
}

export function safeValidateAppointment(data: unknown) {
  return AppointmentSchema.safeParse(data);
}

export function validateMedicalRecord(data: unknown): MedicalRecordDocument {
  return MedicalRecordSchema.parse(data);
}

export function safeValidateMedicalRecord(data: unknown) {
  return MedicalRecordSchema.safeParse(data);
}
