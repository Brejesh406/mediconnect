import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'mediconnect.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high reliability and referential integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function initDatabase() {
  db.exec(`
    -- 1. PROFILES TABLE
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
      full_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 2. DEPARTMENTS TABLE
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      head_doctor_name TEXT,
      location_floor TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 3. DOCTORS TABLE
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      title TEXT NOT NULL,
      specialization TEXT NOT NULL,
      qualifications TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      consultation_fee REAL NOT NULL,
      room_number TEXT NOT NULL,
      bio TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 4. PATIENTS TABLE
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      date_of_birth TEXT,
      gender TEXT,
      blood_group TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      address TEXT,
      allergies TEXT,
      chronic_conditions TEXT,
      insurance_provider TEXT,
      insurance_policy_number TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 5. DOCTOR AVAILABILITY TABLE
    CREATE TABLE IF NOT EXISTS doctor_availability (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 6. APPOINTMENTS TABLE
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
      reason_for_visit TEXT NOT NULL,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Partial unique index to prevent duplicate appointment bookings for the same doctor at the same time
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_appointment 
    ON appointments (doctor_id, appointment_date, start_time) 
    WHERE status NOT IN ('cancelled', 'rejected');

    -- 7. MEDICAL RECORDS TABLE
    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
      appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
      record_date TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      clinical_notes TEXT NOT NULL,
      treatment_plan TEXT NOT NULL,
      follow_up_date TEXT,
      vitals_blood_pressure TEXT,
      vitals_heart_rate INTEGER,
      vitals_temperature REAL,
      vitals_spo2 INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 8. PRESCRIPTIONS TABLE
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      record_id TEXT REFERENCES medical_records(id) ON DELETE SET NULL,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
      issued_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'discontinued')),
      instructions TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 9. PRESCRIPTION ITEMS TABLE
    CREATE TABLE IF NOT EXISTS prescription_items (
      id TEXT PRIMARY KEY,
      prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
      medication_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructions TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 10. NOTIFICATIONS TABLE
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('appointment', 'prescription', 'system', 'record')),
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 11. MEDICAL DOCUMENTS TABLE
    CREATE TABLE IF NOT EXISTS medical_documents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      uploaded_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      document_type TEXT NOT NULL CHECK(document_type IN ('lab_result', 'radiology', 'discharge_summary', 'insurance', 'prescription_scan', 'other')),
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      file_data TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 12. AUDIT LOGS TABLE
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      user_email TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      ip_address TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- INDEXES FOR MAXIMUM QUERY PERFORMANCE
    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at);
  `);

  seedInitialData();
}

// Utility password hasher using node:crypto PBKDF2
export function hashPassword(password: string): string {
  const salt = 'mediconnect_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function seedInitialData() {
  const existingDept = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (existingDept && existingDept.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial MediConnect database...');

  // 1. Seed 6 Departments
  const departments = [
    {
      id: 'dept-cardio-1',
      name: 'Cardiology',
      code: 'CARD',
      description: 'Comprehensive cardiovascular diagnosis, echocardiography, rhythm management, and coronary care.',
      icon: 'HeartPulse',
      head_doctor_name: 'Dr. Sarah Jensen, MD, FACC',
      location_floor: 'Level 3 - West Wing'
    },
    {
      id: 'dept-neuro-2',
      name: 'Neurology',
      code: 'NEUR',
      description: 'Specialized diagnosis and treatment of brain, spinal cord, cranial, and neuromuscular disorders.',
      icon: 'Brain',
      head_doctor_name: 'Dr. Arthur Pendelton, MD, FAAN',
      location_floor: 'Level 4 - East Tower'
    },
    {
      id: 'dept-ortho-3',
      name: 'Orthopedics',
      code: 'ORTH',
      description: 'Musculoskeletal medicine, joint reconstruction, trauma management, and sports rehabilitation.',
      icon: 'Bone',
      head_doctor_name: 'Dr. Marcus Vance, MD, FAAOS',
      location_floor: 'Level 2 - South Pavilion'
    },
    {
      id: 'dept-ophta-4',
      name: 'Ophthalmology',
      code: 'OPHT',
      description: 'Advanced vision science, microsurgery, corneal therapeutics, and optical diagnostics.',
      icon: 'Eye',
      head_doctor_name: 'Dr. Elena Rostova, MD',
      location_floor: 'Level 1 - Ambulatory Suite'
    },
    {
      id: 'dept-pedia-5',
      name: 'Pediatrics',
      code: 'PED',
      description: 'Dedicated clinical care for neonates, children, and adolescents with compassionate child-friendly facilities.',
      icon: 'Baby',
      head_doctor_name: 'Dr. Samantha Jenkins, MD, FAAP',
      location_floor: 'Level 2 - North Atrium'
    },
    {
      id: 'dept-dent-6',
      name: 'Dentistry',
      code: 'DENT',
      description: 'Oral maxillofacial surgery, restorative dentistry, periodontics, and preventive dental health.',
      icon: 'Smile',
      head_doctor_name: 'Dr. David Kim, DDS',
      location_floor: 'Level 1 - Dental Clinic'
    }
  ];

  const insertDept = db.prepare(`
    INSERT INTO departments (id, name, code, description, icon, head_doctor_name, location_floor)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const dept of departments) {
    insertDept.run(dept.id, dept.name, dept.code, dept.description, dept.icon, dept.head_doctor_name, dept.location_floor);
  }

  // 2. Seed Administrator Account
  const adminId = 'usr-admin-01';
  db.prepare(`
    INSERT INTO profiles (id, email, password_hash, role, full_name, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'admin@mediconnect.health',
    hashPassword('admin123'),
    'admin',
    'Hospital Administrator',
    '+1 (555) 019-2831',
    null
  );

  // 3. Seed Doctors
  const doctorsData = [
    {
      profileId: 'usr-doc-cardio',
      email: 'dr.jensen@mediconnect.health',
      password: 'doctor123',
      name: 'Dr. Sarah Jensen, MD',
      phone: '+1 (555) 234-8890',
      avatarUrl: '/src/assets/images/doctor_consultation_female_1794309472028.jpg',
      departmentId: 'dept-cardio-1',
      title: 'Chief of Clinical Cardiology',
      specialization: 'Interventional Cardiology & Echocardiography',
      qualifications: 'MD (Harvard), FACC, Board Certified in Cardiology',
      experienceYears: 16,
      consultationFee: 180.00,
      roomNumber: 'Room 312',
      bio: 'Dr. Jensen brings over 16 years of clinical excellence in cardiovascular disease prevention, non-invasive imaging, and cardiac rehabilitation.'
    },
    {
      profileId: 'usr-doc-neuro',
      email: 'dr.pendelton@mediconnect.health',
      password: 'doctor123',
      name: 'Dr. Arthur Pendelton, MD',
      phone: '+1 (555) 456-9921',
      avatarUrl: '/src/assets/images/doctor_neurologist_male_1794309473514.jpg',
      departmentId: 'dept-neuro-2',
      title: 'Senior Neurologist',
      specialization: 'Stroke, Epilepsy & Neurodegenerative Diagnostics',
      qualifications: 'MD (Johns Hopkins), FAAN, Fellowship in Clinical Neurophysiology',
      experienceYears: 22,
      consultationFee: 220.00,
      roomNumber: 'Room 408',
      bio: 'Leading researcher and clinician specializing in complex neurological diagnostics, cognitive therapeutics, and digital telemetry imaging.'
    },
    {
      profileId: 'usr-doc-pedia',
      email: 'dr.jenkins@mediconnect.health',
      password: 'doctor123',
      name: 'Dr. Samantha Jenkins, MD',
      phone: '+1 (555) 789-1144',
      avatarUrl: '/src/assets/images/doctor_pediatrician_1794309473415.jpg',
      departmentId: 'dept-pedia-5',
      title: 'Pediatric Care Specialist',
      specialization: 'General Pediatrics & Child Development',
      qualifications: 'MD (Stanford), FAAP, Certified Pediatric Specialist',
      experienceYears: 12,
      consultationFee: 150.00,
      roomNumber: 'Room 205',
      bio: 'Dedicated to compassionate, family-centered medical care for newborns, children, and young adolescents in an uplifting environment.'
    },
    {
      profileId: 'usr-doc-ortho',
      email: 'dr.vance@mediconnect.health',
      password: 'doctor123',
      name: 'Dr. Marcus Vance, MD',
      phone: '+1 (555) 321-7788',
      avatarUrl: null,
      departmentId: 'dept-ortho-3',
      title: 'Orthopedic Surgeon',
      specialization: 'Joint Replacement & Sports Medicine',
      qualifications: 'MD (Columbia), FAAOS, Arthroscopy Specialist',
      experienceYears: 18,
      consultationFee: 200.00,
      roomNumber: 'Room 220',
      bio: 'Specialist in minimally invasive orthopedic joint preservation, arthroscopy, and athlete rehabilitation.'
    }
  ];

  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, email, password_hash, role, full_name, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDoctor = db.prepare(`
    INSERT INTO doctors (id, department_id, title, specialization, qualifications, experience_years, consultation_fee, room_number, bio, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAvailability = db.prepare(`
    INSERT INTO doctor_availability (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const doc of doctorsData) {
    insertProfile.run(doc.profileId, doc.email, hashPassword(doc.password), 'doctor', doc.name, doc.phone, doc.avatarUrl);
    insertDoctor.run(doc.profileId, doc.departmentId, doc.title, doc.specialization, doc.qualifications, doc.experienceYears, doc.consultationFee, doc.roomNumber, doc.bio, doc.avatarUrl);

    // Add availability Monday to Friday (days 1 to 5)
    for (let day = 1; day <= 5; day++) {
      insertAvailability.run(`avail-${doc.profileId}-${day}`, doc.profileId, day, '09:00', '17:00', 30, 1);
    }
  }

  // 4. Seed Patients
  const patientsData = [
    {
      id: 'usr-pat-john',
      email: 'john.doe@example.com',
      password: 'patient123',
      name: 'Johnathan Doe',
      phone: '+1 (555) 678-9012',
      dob: '1985-06-14',
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: 'Mary Doe (Spouse)',
      emergencyPhone: '+1 (555) 678-9013',
      address: '742 Evergreen Terrace, Springfield, OR',
      allergies: 'Penicillin, Shellfish',
      chronicConditions: 'Mild Hypertension',
      insuranceProvider: 'Blue Cross Blue Shield Healthcare',
      policyNumber: 'BCBS-99482710-A'
    },
    {
      id: 'usr-pat-emily',
      email: 'emily.watson@example.com',
      password: 'patient123',
      name: 'Emily Watson',
      phone: '+1 (555) 890-1234',
      dob: '1992-11-23',
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: 'Robert Watson (Father)',
      emergencyPhone: '+1 (555) 890-1235',
      address: '1204 Pine Street, Apt 3B, Seattle, WA',
      allergies: 'Latex, Sulfa Drugs',
      chronicConditions: 'None',
      insuranceProvider: 'Aetna Health Advantage',
      policyNumber: 'AET-4019283-B'
    }
  ];

  const insertPatient = db.prepare(`
    INSERT INTO patients (id, date_of_birth, gender, blood_group, emergency_contact, emergency_phone, address, allergies, chronic_conditions, insurance_provider, insurance_policy_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const pat of patientsData) {
    insertProfile.run(pat.id, pat.email, hashPassword(pat.password), 'patient', pat.name, pat.phone, null);
    insertPatient.run(pat.id, pat.dob, pat.gender, pat.bloodGroup, pat.emergencyContact, pat.emergencyPhone, pat.address, pat.allergies, pat.chronicConditions, pat.insuranceProvider, pat.policyNumber);
  }

  // 5. Seed Initial Appointments
  const insertAppt = db.prepare(`
    INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, status, reason_for_visit, cancellation_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Past completed appointment for John Doe with Dr. Jensen
  insertAppt.run(
    'appt-001',
    'usr-pat-john',
    'usr-doc-cardio',
    'dept-cardio-1',
    '2026-11-02',
    '10:00',
    '10:30',
    'completed',
    'Annual cardiology evaluation and routine ECG assessment',
    null
  );

  // Upcoming confirmed appointment for John Doe with Dr. Jensen
  insertAppt.run(
    'appt-002',
    'usr-pat-john',
    'usr-doc-cardio',
    'dept-cardio-1',
    '2026-11-18',
    '11:00',
    '11:30',
    'confirmed',
    'Follow-up blood pressure review and echocardiogram check',
    null
  );

  // Upcoming confirmed appointment for Emily Watson with Dr. Pendelton
  insertAppt.run(
    'appt-003',
    'usr-pat-emily',
    'usr-doc-neuro',
    'dept-neuro-2',
    '2026-11-20',
    '14:00',
    '14:30',
    'confirmed',
    'Frequent tension headache assessment and cranial nerve check',
    null
  );

  // Pending appointment for Emily Watson with Dr. Vance
  insertAppt.run(
    'appt-004',
    'usr-pat-emily',
    'usr-doc-ortho',
    'dept-ortho-3',
    '2026-11-25',
    '09:30',
    '10:00',
    'pending',
    'Right knee joint ache following marathon running training',
    null
  );

  // 6. Seed Medical Record for the completed appointment
  const recordId = 'rec-001';
  db.prepare(`
    INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, record_date, diagnosis, symptoms, clinical_notes, treatment_plan, follow_up_date, vitals_blood_pressure, vitals_heart_rate, vitals_temperature, vitals_spo2)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    recordId,
    'usr-pat-john',
    'usr-doc-cardio',
    'appt-001',
    '2026-11-02',
    'Stage 1 Essential Hypertension (Controlled)',
    'Mild afternoon fatigue, occasional exertional palpitations',
    'Patient presents for routine cardiovascular review. S1/S2 heart sounds clear, no carotid bruits, lungs resonant. Baseline 12-lead ECG demonstrated normal sinus rhythm without ischemic ST changes.',
    'Continue low-sodium dietary regimen (DASH diet). Daily brisk walking 30 minutes. Maintain Lisinopril 10mg PO once daily in morning. Schedule 6-month laboratory renal panel and clinic re-check.',
    '2026-11-18',
    '132/84 mmHg',
    72,
    98.4,
    99
  );

  // 7. Seed Prescription
  const rxId = 'rx-001';
  db.prepare(`
    INSERT INTO prescriptions (id, record_id, patient_id, doctor_id, issued_date, status, instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    rxId,
    recordId,
    'usr-pat-john',
    'usr-doc-cardio',
    '2026-11-02',
    'active',
    'Take medications with a full glass of water every morning with breakfast. Monitor blood pressure twice weekly.'
  );

  const insertRxItem = db.prepare(`
    INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration, instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertRxItem.run(
    'rx-item-01',
    rxId,
    'Lisinopril',
    '10 mg oral tablet',
    'Once daily',
    '90 days',
    'Take with morning meal'
  );

  insertRxItem.run(
    'rx-item-02',
    rxId,
    'CoQ10 Cardiovascular Support',
    '100 mg capsule',
    'Once daily',
    '90 days',
    'Take alongside daily vitamin supplement'
  );

  // 8. Seed Medical Documents
  // Sample base64 placeholder for a verified clinical lab report
  const samplePdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNTIKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRECihNZWRpQ29ubmVjdCBIb3NwaXRhbCAtIENsaW5pY2FsIExhYiBSZXBvcnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjE5IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzIyCiUlRU9G';

  db.prepare(`
    INSERT INTO medical_documents (id, patient_id, uploaded_by, title, document_type, file_name, file_size, mime_type, file_data, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'doc-001',
    'usr-pat-john',
    'usr-doc-cardio',
    'Complete Lipid Panel & Cardiac Biomarkers',
    'lab_result',
    'Lipid_Biomarkers_Nov2026.pdf',
    24800,
    'application/pdf',
    samplePdfBase64,
    'Verified by Central Pathology Lab. Total cholesterol 178 mg/dL (Normal), HDL 54 mg/dL, LDL 102 mg/dL.'
  );

  db.prepare(`
    INSERT INTO medical_documents (id, patient_id, uploaded_by, title, document_type, file_name, file_size, mime_type, file_data, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'doc-002',
    'usr-pat-john',
    'usr-pat-john',
    'Previous Hospital Discharge Summary (2024)',
    'discharge_summary',
    'Hospital_Discharge_Summary_2024.pdf',
    34200,
    'application/pdf',
    samplePdfBase64,
    'Uploaded by patient for physician review prior to consult.'
  );

  // 9. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(
    'notif-001',
    'usr-pat-john',
    'Appointment Confirmed',
    'Your upcoming appointment with Dr. Sarah Jensen has been confirmed for Nov 18, 2026 at 11:00 AM.',
    'appointment',
    0,
    '/appointments'
  );

  insertNotif.run(
    'notif-002',
    'usr-pat-john',
    'New Prescription Issued',
    'Dr. Sarah Jensen has prescribed Lisinopril 10mg. Tap to review dosage instructions.',
    'prescription',
    0,
    '/prescriptions'
  );

  insertNotif.run(
    'notif-003',
    'usr-doc-cardio',
    'New Patient Booked',
    'Johnathan Doe has booked an appointment for Nov 18, 2026 at 11:00 AM.',
    'appointment',
    0,
    '/doctor-schedule'
  );

  // 10. Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_email, role, action, resource_type, resource_id, ip_address, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    'audit-001',
    'usr-admin-01',
    'admin@mediconnect.health',
    'admin',
    'SYSTEM_BOOTSTRAP',
    'system',
    'sys-root',
    '127.0.0.1',
    'Initial MediConnect system tables and hospital departments initialized.'
  );

  insertAudit.run(
    'audit-002',
    'usr-doc-cardio',
    'dr.jensen@mediconnect.health',
    'doctor',
    'RECORD_CREATE',
    'medical_records',
    recordId,
    '192.168.1.45',
    'Created consultation medical record and prescription for patient usr-pat-john.'
  );

  console.log('MediConnect initial database successfully initialized.');
}
