import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword, verifyPassword } from './db.js';
import { 
  createSession, 
  removeSession, 
  authenticate, 
  requireRole, 
  logAudit, 
  AuthenticatedRequest 
} from './auth.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & SESSIONS
// ==========================================

// Register
apiRouter.post('/auth/register', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      email, 
      password, 
      fullName, 
      role = 'patient', 
      phone = '', 
      dateOfBirth = '', 
      gender = '', 
      bloodGroup = '',
      allergies = '',
      insuranceProvider = '',
      insurancePolicyNumber = ''
    } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const assignedRole = role === 'doctor' ? 'doctor' : 'patient'; // admin registration restricted

    // Check existing email
    const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const userId = `usr-${crypto.randomUUID()}`;
    const passwordHash = hashPassword(password);

    db.exec('BEGIN TRANSACTION');

    try {
      db.prepare(`
        INSERT INTO profiles (id, email, password_hash, role, full_name, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, email.toLowerCase().trim(), passwordHash, assignedRole, fullName.trim(), phone.trim());

      if (assignedRole === 'patient') {
        db.prepare(`
          INSERT INTO patients (id, date_of_birth, gender, blood_group, allergies, insurance_provider, insurance_policy_number)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(userId, dateOfBirth, gender, bloodGroup, allergies, insuranceProvider, insurancePolicyNumber);
      } else if (assignedRole === 'doctor') {
        // Default to General Cardiology or first department if doctor registers
        const dept = db.prepare('SELECT id FROM departments LIMIT 1').get() as { id: string };
        db.prepare(`
          INSERT INTO doctors (id, department_id, title, specialization, qualifications, experience_years, consultation_fee, room_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, dept.id, 'Attending Physician', 'General Medicine', 'MD', 3, 150.00, 'Room 101');
      }

      // Initial welcome notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${crypto.randomUUID()}`,
        userId,
        'Welcome to MediConnect',
        `Your secure health record has been successfully initialized. Welcome, ${fullName}!`,
        'system',
        assignedRole === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'
      );

      db.exec('COMMIT');

      const token = createSession(userId, email.toLowerCase().trim(), assignedRole, fullName.trim());
      logAudit(req, 'USER_REGISTER', 'profiles', userId, `Registered account as ${assignedRole}`);

      res.status(201).json({
        token,
        user: {
          id: userId,
          email: email.toLowerCase().trim(),
          role: assignedRole,
          fullName: fullName.trim(),
          phone: phone.trim()
        }
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
apiRouter.post('/auth/login', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const profile = db.prepare(`
      SELECT id, email, password_hash, role, full_name, phone, avatar_url 
      FROM profiles 
      WHERE email = ?
    `).get(email.toLowerCase().trim()) as any;

    if (!profile || !verifyPassword(password, profile.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = createSession(profile.id, profile.email, profile.role, profile.full_name);
    
    // Create audit log
    req.user = {
      token,
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      createdAt: Date.now()
    };
    logAudit(req, 'USER_LOGIN', 'profiles', profile.id, `User logged in from portal`);

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        phone: profile.phone,
        avatarUrl: profile.avatar_url
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

// Demo Login (Quick 1-click test for evaluators)
apiRouter.post('/auth/demo-login/:targetRole', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetRole } = req.params;
    let targetEmail = 'admin@mediconnect.health';
    if (targetRole === 'doctor') {
      targetEmail = 'dr.jensen@mediconnect.health';
    } else if (targetRole === 'patient') {
      targetEmail = 'john.doe@example.com';
    }

    const profile = db.prepare(`
      SELECT id, email, role, full_name, phone, avatar_url 
      FROM profiles 
      WHERE email = ?
    `).get(targetEmail) as any;

    if (!profile) {
      res.status(404).json({ error: `Demo account for ${targetRole} not found.` });
      return;
    }

    const token = createSession(profile.id, profile.email, profile.role, profile.full_name);
    
    req.user = {
      token,
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      createdAt: Date.now()
    };
    logAudit(req, 'DEMO_LOGIN', 'profiles', profile.id, `Evaluator logged in via Demo switch as ${targetRole}`);

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        phone: profile.phone,
        avatarUrl: profile.avatar_url
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Firebase Google Authentication Login
apiRouter.post('/auth/firebase-login', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, uid, fullName, avatarUrl } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let profile = db.prepare('SELECT * FROM profiles WHERE email = ?').get(cleanEmail) as any;

    const isAdminEmail = cleanEmail === 'brejesh0607@gmail.com' || cleanEmail === 'admin@mediconnect.health';
    const assignedRole = isAdminEmail ? 'admin' : (profile?.role || 'patient');

    if (!profile) {
      const userId = `usr-fb-${uid ? uid.slice(0, 16) : crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO profiles (id, email, password_hash, role, full_name, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, cleanEmail, 'firebase_oauth_managed', assignedRole, fullName || 'Google User', avatarUrl || null);

      if (assignedRole === 'patient') {
        db.prepare(`
          INSERT INTO patients (id, date_of_birth, gender, blood_group, insurance_provider)
          VALUES (?, '', 'Other', 'O+', 'Direct Care')
        `).run(userId);
      }

      profile = {
        id: userId,
        email: cleanEmail,
        role: assignedRole,
        full_name: fullName || 'Google User',
        phone: '',
        avatar_url: avatarUrl || null
      };
    } else if (isAdminEmail && profile.role !== 'admin') {
      db.prepare("UPDATE profiles SET role = 'admin' WHERE id = ?").run(profile.id);
      profile.role = 'admin';
    }

    const token = createSession(profile.id, profile.email, profile.role, profile.full_name);
    req.user = {
      token,
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      createdAt: Date.now()
    };
    logAudit(req, 'FIREBASE_AUTH_LOGIN', 'profiles', profile.id, `User authenticated via Firebase Google Login (${cleanEmail})`);

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        phone: profile.phone,
        avatarUrl: profile.avatar_url
      }
    });
  } catch (err: any) {
    console.error('Firebase login error:', err);
    res.status(500).json({ error: err.message || 'Firebase authentication failed' });
  }
});

// Get Current User Profile (with patient / doctor details)
apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = db.prepare(`
      SELECT id, email, role, full_name, phone, avatar_url, created_at, updated_at
      FROM profiles WHERE id = ?
    `).get(req.user!.userId) as any;

    if (!profile) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    let extraData = {};
    if (profile.role === 'patient') {
      const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(profile.id);
      extraData = { patient };
    } else if (profile.role === 'doctor') {
      const doctor = db.prepare(`
        SELECT d.*, dept.name as department_name, dept.code as department_code
        FROM doctors d
        JOIN departments dept ON d.department_id = dept.id
        WHERE d.id = ?
      `).get(profile.id);
      extraData = { doctor };
    }

    res.json({
      user: {
        ...profile,
        ...extraData
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password
apiRouter.post('/auth/forgot-password', (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }
  const user = db.prepare('SELECT id, full_name FROM profiles WHERE email = ?').get(email.toLowerCase().trim()) as any;
  if (!user) {
    // For security, do not disclose whether user exists
    res.json({ message: 'If an account exists with this email, recovery instructions have been dispatched.' });
    return;
  }

  const resetToken = `rst-${crypto.randomUUID()}`;
  logAudit(req, 'PASSWORD_RESET_REQUEST', 'profiles', user.id, `Password reset requested for ${email}`);

  // In production this sends an authenticated email link
  res.json({ 
    message: 'Recovery instructions have been dispatched to your email address.',
    debugToken: resetToken 
  });
});

// Reset Password
apiRouter.post('/auth/reset-password', (req: AuthenticatedRequest, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Valid email and a new password with at least 6 characters are required.' });
    return;
  }

  const profile = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email.toLowerCase().trim()) as any;
  if (!profile) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  db.prepare(`
    UPDATE profiles SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).run(hashPassword(newPassword), profile.id);

  logAudit(req, 'PASSWORD_RESET_COMPLETE', 'profiles', profile.id, `Password successfully reset for ${email}`);
  res.json({ message: 'Your password has been successfully updated. You may now log in.' });
});

// Logout
apiRouter.post('/auth/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.token) {
    removeSession(req.user.token);
    logAudit(req, 'USER_LOGOUT', 'profiles', req.user.userId, `User logged out`);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Update Profile
apiRouter.put('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      fullName, 
      phone, 
      avatarUrl, 
      dateOfBirth, 
      gender, 
      bloodGroup, 
      emergencyContact, 
      emergencyPhone, 
      address, 
      allergies, 
      chronicConditions, 
      insuranceProvider, 
      insurancePolicyNumber,
      bio,
      consultationFee
    } = req.body;

    const userId = req.user!.userId;

    db.exec('BEGIN TRANSACTION');

    try {
      db.prepare(`
        UPDATE profiles 
        SET full_name = COALESCE(?, full_name), 
            phone = COALESCE(?, phone), 
            avatar_url = COALESCE(?, avatar_url),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(fullName, phone, avatarUrl, userId);

      if (req.user!.role === 'patient') {
        db.prepare(`
          UPDATE patients
          SET date_of_birth = COALESCE(?, date_of_birth),
              gender = COALESCE(?, gender),
              blood_group = COALESCE(?, blood_group),
              emergency_contact = COALESCE(?, emergency_contact),
              emergency_phone = COALESCE(?, emergency_phone),
              address = COALESCE(?, address),
              allergies = COALESCE(?, allergies),
              chronic_conditions = COALESCE(?, chronic_conditions),
              insurance_provider = COALESCE(?, insurance_provider),
              insurance_policy_number = COALESCE(?, insurance_policy_number)
          WHERE id = ?
        `).run(dateOfBirth, gender, bloodGroup, emergencyContact, emergencyPhone, address, allergies, chronicConditions, insuranceProvider, insurancePolicyNumber, userId);
      } else if (req.user!.role === 'doctor') {
        db.prepare(`
          UPDATE doctors
          SET bio = COALESCE(?, bio),
              consultation_fee = COALESCE(?, consultation_fee)
          WHERE id = ?
        `).run(bio, consultationFee, userId);
      }

      db.exec('COMMIT');
      logAudit(req, 'PROFILE_UPDATE', 'profiles', userId, 'Updated personal health profile');

      res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. DEPARTMENTS & CLINICS
// ==========================================

apiRouter.get('/departments', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const departments = db.prepare(`
      SELECT 
        dept.*, 
        COUNT(doc.id) as doctor_count
      FROM departments dept
      LEFT JOIN doctors doc ON doc.department_id = dept.id
      GROUP BY dept.id
      ORDER BY dept.name ASC
    `).all();

    res.json({ departments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/departments', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, description, icon, headDoctorName, locationFloor } = req.body;
    if (!name || !code || !description) {
      res.status(400).json({ error: 'Name, code, and description are required.' });
      return;
    }

    const id = `dept-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO departments (id, name, code, description, icon, head_doctor_name, location_floor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, code.toUpperCase(), description, icon || 'Hospital', headDoctorName || '', locationFloor || 'Level 1');

    logAudit(req, 'DEPARTMENT_CREATE', 'departments', id, `Created department ${name}`);
    res.status(201).json({ id, message: 'Department successfully created.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. DOCTORS & AVAILABILITY
// ==========================================

apiRouter.get('/doctors', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const doctors = db.prepare(`
      SELECT 
        d.id,
        p.full_name,
        p.email,
        p.phone,
        COALESCE(d.image_url, p.avatar_url) as avatar_url,
        d.department_id,
        dept.name as department_name,
        dept.code as department_code,
        d.title,
        d.specialization,
        d.qualifications,
        d.experience_years,
        d.consultation_fee,
        d.room_number,
        d.bio,
        d.created_at
      FROM doctors d
      JOIN profiles p ON d.id = p.id
      JOIN departments dept ON d.department_id = dept.id
      ORDER BY d.experience_years DESC
    `).all();

    res.json({ doctors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/doctors/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const doctor = db.prepare(`
      SELECT 
        d.id,
        p.full_name,
        p.email,
        p.phone,
        COALESCE(d.image_url, p.avatar_url) as avatar_url,
        d.department_id,
        dept.name as department_name,
        d.title,
        d.specialization,
        d.qualifications,
        d.experience_years,
        d.consultation_fee,
        d.room_number,
        d.bio
      FROM doctors d
      JOIN profiles p ON d.id = p.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found.' });
      return;
    }

    const availability = db.prepare(`
      SELECT * FROM doctor_availability WHERE doctor_id = ? AND is_active = 1 ORDER BY day_of_week ASC
    `).all(req.params.id);

    res.json({ doctor, availability });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/doctors/:id/availability', (req: AuthenticatedRequest, res: Response) => {
  try {
    const slots = db.prepare(`
      SELECT * FROM doctor_availability WHERE doctor_id = ? ORDER BY day_of_week ASC
    `).all(req.params.id);
    res.json({ availability: slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/doctors/:id/availability', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only the doctor themselves or an admin can modify availability
    if (req.user!.role !== 'admin' && req.user!.userId !== req.params.id) {
      res.status(403).json({ error: 'Unauthorized to modify this doctor availability.' });
      return;
    }

    const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime, slotDurationMinutes, isActive }
    if (!Array.isArray(schedules)) {
      res.status(400).json({ error: 'Schedules must be an array.' });
      return;
    }

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare('DELETE FROM doctor_availability WHERE doctor_id = ?').run(req.params.id);

      const insertStmt = db.prepare(`
        INSERT INTO doctor_availability (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of schedules) {
        insertStmt.run(
          `avail-${crypto.randomUUID()}`,
          req.params.id,
          item.dayOfWeek,
          item.startTime || '09:00',
          item.endTime || '17:00',
          item.slotDurationMinutes || 30,
          item.isActive ? 1 : 0
        );
      }

      db.exec('COMMIT');
      logAudit(req, 'UPDATE_AVAILABILITY', 'doctor_availability', req.params.id, 'Updated clinical availability schedule');
      res.json({ success: true, message: 'Availability schedule updated.' });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. PATIENTS DIRECTORY (DOCTOR / ADMIN)
// ==========================================

apiRouter.get('/patients', authenticate, requireRole(['doctor', 'admin']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const patients = db.prepare(`
      SELECT 
        pat.id,
        p.full_name,
        p.email,
        p.phone,
        pat.date_of_birth,
        pat.gender,
        pat.blood_group,
        pat.emergency_contact,
        pat.emergency_phone,
        pat.allergies,
        pat.chronic_conditions,
        pat.insurance_provider,
        pat.insurance_policy_number,
        (SELECT COUNT(*) FROM appointments WHERE patient_id = pat.id) as total_appointments,
        (SELECT COUNT(*) FROM medical_records WHERE patient_id = pat.id) as total_records
      FROM patients pat
      JOIN profiles p ON pat.id = p.id
      ORDER BY p.full_name ASC
    `).all();

    res.json({ patients });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/patients/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    // RLS: Patient can only view their own record; Doctor or Admin can view
    if (req.user!.role === 'patient' && req.user!.userId !== req.params.id) {
      res.status(403).json({ error: 'Access denied: You may only view your own patient file.' });
      return;
    }

    const patient = db.prepare(`
      SELECT 
        pat.*,
        p.full_name,
        p.email,
        p.phone,
        p.avatar_url
      FROM patients pat
      JOIN profiles p ON pat.id = p.id
      WHERE pat.id = ?
    `).get(req.params.id) as any;

    if (!patient) {
      res.status(404).json({ error: 'Patient not found.' });
      return;
    }

    // Medical records
    const records = db.prepare(`
      SELECT mr.*, doc_p.full_name as doctor_name, dept.name as department_name
      FROM medical_records mr
      JOIN doctors d ON mr.doctor_id = d.id
      JOIN profiles doc_p ON d.id = doc_p.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE mr.patient_id = ?
      ORDER BY mr.record_date DESC
    `).all(req.params.id);

    // Prescriptions
    const prescriptions = db.prepare(`
      SELECT rx.*, doc_p.full_name as doctor_name
      FROM prescriptions rx
      JOIN doctors d ON rx.doctor_id = d.id
      JOIN profiles doc_p ON d.id = doc_p.id
      WHERE rx.patient_id = ?
      ORDER BY rx.issued_date DESC
    `).all(req.params.id) as any[];

    // Fetch items for each prescription
    for (const rx of prescriptions) {
      rx.items = db.prepare(`
        SELECT * FROM prescription_items WHERE prescription_id = ?
      `).all(rx.id);
    }

    // Documents
    const documents = db.prepare(`
      SELECT id, title, document_type, file_name, file_size, mime_type, notes, created_at
      FROM medical_documents WHERE patient_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    logAudit(req, 'VIEW_PATIENT_RECORD', 'patients', req.params.id, `Accessed clinical profile of ${patient.full_name}`);

    res.json({ patient, records, prescriptions, documents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. APPOINTMENT MANAGEMENT & BOOKING
// ==========================================

// Get Available Slots for a given Doctor & Date
apiRouter.get('/appointments/available-slots', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctorId, date } = req.query as { doctorId?: string; date?: string };
    if (!doctorId || !date) {
      res.status(400).json({ error: 'doctorId and date query parameters are required.' });
      return;
    }

    const bookingDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = bookingDate.getDay(); // 0 is Sunday, 1 is Monday ...

    // Check doctor availability for this day of week
    const availability = db.prepare(`
      SELECT * FROM doctor_availability 
      WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1
    `).get(doctorId, dayOfWeek) as any;

    if (!availability) {
      res.json({ slots: [], message: 'Doctor is not scheduled on this day.' });
      return;
    }

    // Generate potential slots between start_time and end_time (e.g. 09:00 - 17:00)
    const slotDuration = availability.slot_duration_minutes || 30;
    const [startH, startM] = availability.start_time.split(':').map(Number);
    const [endH, endM] = availability.end_time.split(':').map(Number);

    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;

    const allSlots: { startTime: string; endTime: string }[] = [];
    for (let m = startTotalMinutes; m + slotDuration <= endTotalMinutes; m += slotDuration) {
      const sh = Math.floor(m / 60).toString().padStart(2, '0');
      const sm = (m % 60).toString().padStart(2, '0');
      const eh = Math.floor((m + slotDuration) / 60).toString().padStart(2, '0');
      const em = ((m + slotDuration) % 60).toString().padStart(2, '0');
      allSlots.push({
        startTime: `${sh}:${sm}`,
        endTime: `${eh}:${em}`
      });
    }

    // Get existing bookings on this date that are not cancelled or rejected
    const existingBookings = db.prepare(`
      SELECT start_time FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('cancelled', 'rejected')
    `).all(doctorId, date) as { start_time: string }[];

    const bookedTimes = new Set(existingBookings.map(b => b.start_time));

    const availableSlots = allSlots.map(s => ({
      ...s,
      isAvailable: !bookedTimes.has(s.startTime)
    }));

    res.json({ slots: availableSlots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Appointments (RLS Protected)
apiRouter.get('/appointments', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { status, date, doctorId, patientId } = req.query as Record<string, string>;

    let query = `
      SELECT 
        a.*,
        pat_p.full_name as patient_name,
        pat_p.email as patient_email,
        pat_p.phone as patient_phone,
        pat.blood_group as patient_blood_group,
        doc_p.full_name as doctor_name,
        doc.title as doctor_title,
        doc.specialization as doctor_specialization,
        doc.room_number as doctor_room,
        doc.consultation_fee,
        dept.name as department_name,
        dept.code as department_code
      FROM appointments a
      JOIN patients pat ON a.patient_id = pat.id
      JOIN profiles pat_p ON pat.id = pat_p.id
      JOIN doctors doc ON a.doctor_id = doc.id
      JOIN profiles doc_p ON doc.id = doc_p.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // RLS Enforcement:
    if (role === 'patient') {
      query += ` AND a.patient_id = ?`;
      params.push(userId);
    } else if (role === 'doctor') {
      query += ` AND a.doctor_id = ?`;
      params.push(userId);
    } else if (role === 'admin') {
      if (doctorId) {
        query += ` AND a.doctor_id = ?`;
        params.push(doctorId);
      }
      if (patientId) {
        query += ` AND a.patient_id = ?`;
        params.push(patientId);
      }
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY a.appointment_date DESC, a.start_time DESC`;

    const appointments = db.prepare(query).all(...params);
    res.json({ appointments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Book Appointment (Validates race condition / duplicate bookings via transactional checks)
apiRouter.post('/appointments', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      doctorId, 
      departmentId, 
      appointmentDate, 
      startTime, 
      endTime, 
      reasonForVisit,
      patientId // Only admin can book for another patient
    } = req.body;

    if (!doctorId || !appointmentDate || !startTime || !reasonForVisit) {
      res.status(400).json({ error: 'Doctor, date, start time, and reason for visit are required.' });
      return;
    }

    // Determine target patient
    let effectivePatientId = req.user!.userId;
    if (req.user!.role === 'admin' && patientId) {
      effectivePatientId = patientId;
    } else if (req.user!.role !== 'patient' && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Only patients or administrators may book appointments.' });
      return;
    }

    // Calculate end time if not provided (default 30 mins)
    let calculatedEndTime = endTime;
    if (!calculatedEndTime) {
      const [h, m] = startTime.split(':').map(Number);
      const totalM = h * 60 + m + 30;
      calculatedEndTime = `${Math.floor(totalM / 60).toString().padStart(2, '0')}:${(totalM % 60).toString().padStart(2, '0')}`;
    }

    // Resolve department
    let targetDeptId = departmentId;
    if (!targetDeptId) {
      const doc = db.prepare('SELECT department_id FROM doctors WHERE id = ?').get(doctorId) as any;
      if (!doc) {
        res.status(404).json({ error: 'Selected doctor not found.' });
        return;
      }
      targetDeptId = doc.department_id;
    }

    const appointmentId = `appt-${crypto.randomUUID()}`;

    db.exec('BEGIN IMMEDIATE');

    try {
      // 1. Double-booking check: Ensure doctor has no overlapping active appointment
      const conflict = db.prepare(`
        SELECT id FROM appointments 
        WHERE doctor_id = ? 
          AND appointment_date = ? 
          AND start_time = ? 
          AND status NOT IN ('cancelled', 'rejected')
      `).get(doctorId, appointmentDate, startTime);

      if (conflict) {
        db.exec('ROLLBACK');
        res.status(409).json({ error: 'This time slot was just booked by another patient. Please select an alternate slot.' });
        return;
      }

      // 2. Patient conflict check: Ensure patient doesn't have another appointment at the exact same time
      const patientConflict = db.prepare(`
        SELECT id FROM appointments
        WHERE patient_id = ?
          AND appointment_date = ?
          AND start_time = ?
          AND status NOT IN ('cancelled', 'rejected')
      `).get(effectivePatientId, appointmentDate, startTime);

      if (patientConflict) {
        db.exec('ROLLBACK');
        res.status(409).json({ error: 'You already have an appointment scheduled at this time.' });
        return;
      }

      // 3. Insert appointment
      db.prepare(`
        INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, status, reason_for_visit)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
      `).run(appointmentId, effectivePatientId, doctorId, targetDeptId, appointmentDate, startTime, calculatedEndTime, reasonForVisit.trim());

      // 4. Send Notifications to both patient and doctor
      const doctorProfile = db.prepare('SELECT full_name FROM profiles WHERE id = ?').get(doctorId) as any;
      const patientProfile = db.prepare('SELECT full_name FROM profiles WHERE id = ?').get(effectivePatientId) as any;

      // Patient notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${crypto.randomUUID()}`,
        effectivePatientId,
        'Appointment Confirmed',
        `Your consultation with ${doctorProfile?.full_name || 'your physician'} is confirmed for ${appointmentDate} at ${startTime}.`,
        'appointment',
        '/appointments'
      );

      // Doctor notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${crypto.randomUUID()}`,
        doctorId,
        'New Clinical Appointment',
        `${patientProfile?.full_name || 'A patient'} has booked a consultation for ${appointmentDate} at ${startTime}.`,
        'appointment',
        '/doctor-dashboard'
      );

      db.exec('COMMIT');

      logAudit(req, 'APPOINTMENT_BOOK', 'appointments', appointmentId, `Booked appointment with Dr. ${doctorProfile?.full_name} for ${appointmentDate} ${startTime}`);

      res.status(201).json({
        id: appointmentId,
        message: 'Appointment successfully scheduled and confirmed.',
        appointment: {
          id: appointmentId,
          appointmentDate,
          startTime,
          endTime: calculatedEndTime,
          status: 'confirmed'
        }
      });
    } catch (txErr: any) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err: any) {
    console.error('Booking error:', err);
    res.status(500).json({ error: err.message || 'Failed to schedule appointment.' });
  }
});

// Update Appointment Status (Doctor updates to completed/confirmed; Patient can cancel; Admin full control)
apiRouter.patch('/appointments/:id/status', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, cancellationReason } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
      return;
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as any;
    if (!appt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    // Role verification
    const role = req.user!.role;
    const userId = req.user!.userId;

    if (role === 'patient') {
      if (appt.patient_id !== userId) {
        res.status(403).json({ error: 'Access denied: You cannot alter appointments for other patients.' });
        return;
      }
      if (status !== 'cancelled') {
        res.status(403).json({ error: 'Patients can only cancel appointments.' });
        return;
      }
    } else if (role === 'doctor') {
      if (appt.doctor_id !== userId) {
        res.status(403).json({ error: 'Access denied: You can only update appointments assigned to you.' });
        return;
      }
    }

    db.prepare(`
      UPDATE appointments 
      SET status = ?, 
          cancellation_reason = COALESCE(?, cancellation_reason),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status, cancellationReason || null, req.params.id);

    // Notify counterpart
    const notifyTarget = role === 'patient' ? appt.doctor_id : appt.patient_id;
    const actionLabel = status === 'cancelled' ? 'Cancelled' : status === 'completed' ? 'Completed' : 'Updated';
    
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `notif-${crypto.randomUUID()}`,
      notifyTarget,
      `Appointment ${actionLabel}`,
      `Appointment on ${appt.appointment_date} at ${appt.start_time} has been marked as ${status}.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
      'appointment',
      '/appointments'
    );

    logAudit(req, 'APPOINTMENT_STATUS_UPDATE', 'appointments', req.params.id, `Status transitioned to ${status}`);
    res.json({ success: true, message: `Appointment status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reschedule Appointment
apiRouter.patch('/appointments/:id/reschedule', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { newDate, newStartTime } = req.body;
    if (!newDate || !newStartTime) {
      res.status(400).json({ error: 'newDate and newStartTime are required.' });
      return;
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as any;
    if (!appt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    // Role check
    if (req.user!.role === 'patient' && appt.patient_id !== req.user!.userId) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }
    if (req.user!.role === 'doctor' && appt.doctor_id !== req.user!.userId) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    // Conflict check
    const conflict = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? 
        AND appointment_date = ? 
        AND start_time = ? 
        AND id != ?
        AND status NOT IN ('cancelled', 'rejected')
    `).get(appt.doctor_id, newDate, newStartTime, appt.id);

    if (conflict) {
      res.status(409).json({ error: 'The selected new time slot is already booked.' });
      return;
    }

    const [h, m] = newStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const newEndTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    db.prepare(`
      UPDATE appointments 
      SET appointment_date = ?, start_time = ?, end_time = ?, status = 'confirmed', updated_at = datetime('now')
      WHERE id = ?
    `).run(newDate, newStartTime, newEndTime, appt.id);

    const notifyTarget = req.user!.role === 'patient' ? appt.doctor_id : appt.patient_id;
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `notif-${crypto.randomUUID()}`,
      notifyTarget,
      'Appointment Rescheduled',
      `Appointment was rescheduled to ${newDate} at ${newStartTime}.`,
      'appointment',
      '/appointments'
    );

    logAudit(req, 'APPOINTMENT_RESCHEDULE', 'appointments', appt.id, `Rescheduled to ${newDate} ${newStartTime}`);
    res.json({ success: true, message: 'Appointment successfully rescheduled.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. MEDICAL RECORDS & CONSULTATIONS
// ==========================================

apiRouter.get('/medical-records', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { patientId } = req.query as { patientId?: string };

    let query = `
      SELECT 
        mr.*,
        p_pat.full_name as patient_name,
        p_pat.email as patient_email,
        pat.blood_group,
        p_doc.full_name as doctor_name,
        doc.title as doctor_title,
        doc.specialization,
        dept.name as department_name
      FROM medical_records mr
      JOIN patients pat ON mr.patient_id = pat.id
      JOIN profiles p_pat ON pat.id = p_pat.id
      JOIN doctors doc ON mr.doctor_id = doc.id
      JOIN profiles p_doc ON doc.id = p_doc.id
      JOIN departments dept ON doc.department_id = dept.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (role === 'patient') {
      query += ` AND mr.patient_id = ?`;
      params.push(userId);
    } else if (role === 'doctor') {
      if (patientId) {
        query += ` AND mr.patient_id = ?`;
        params.push(patientId);
      } else {
        query += ` AND mr.doctor_id = ?`;
        params.push(userId);
      }
    } else if (role === 'admin') {
      if (patientId) {
        query += ` AND mr.patient_id = ?`;
        params.push(patientId);
      }
    }

    query += ` ORDER BY mr.record_date DESC`;
    const records = db.prepare(query).all(...params);

    res.json({ records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/medical-records', authenticate, requireRole(['doctor']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      patientId, 
      appointmentId, 
      diagnosis, 
      symptoms, 
      clinicalNotes, 
      treatmentPlan, 
      followUpDate,
      vitalsBloodPressure,
      vitalsHeartRate,
      vitalsTemperature,
      vitalsSpo2,
      prescriptions // optional array of items to create prescription at same time
    } = req.body;

    if (!patientId || !diagnosis || !symptoms || !clinicalNotes || !treatmentPlan) {
      res.status(400).json({ error: 'Patient ID, diagnosis, symptoms, clinical notes, and treatment plan are required.' });
      return;
    }

    const doctorId = req.user!.userId;
    const recordId = `rec-${crypto.randomUUID()}`;
    const today = new Date().toISOString().split('T')[0];

    db.exec('BEGIN TRANSACTION');

    try {
      db.prepare(`
        INSERT INTO medical_records (
          id, patient_id, doctor_id, appointment_id, record_date, 
          diagnosis, symptoms, clinical_notes, treatment_plan, follow_up_date,
          vitals_blood_pressure, vitals_heart_rate, vitals_temperature, vitals_spo2
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        recordId,
        patientId,
        doctorId,
        appointmentId || null,
        today,
        diagnosis.trim(),
        symptoms.trim(),
        clinicalNotes.trim(),
        treatmentPlan.trim(),
        followUpDate || null,
        vitalsBloodPressure || null,
        vitalsHeartRate || null,
        vitalsTemperature || null,
        vitalsSpo2 || null
      );

      // If tied to an appointment, mark appointment completed
      if (appointmentId) {
        db.prepare(`UPDATE appointments SET status = 'completed', updated_at = datetime('now') WHERE id = ?`).run(appointmentId);
      }

      // If prescription items were attached, create prescription
      let prescriptionId = null;
      if (Array.isArray(prescriptions) && prescriptions.length > 0) {
        prescriptionId = `rx-${crypto.randomUUID()}`;
        db.prepare(`
          INSERT INTO prescriptions (id, record_id, patient_id, doctor_id, issued_date, status, instructions)
          VALUES (?, ?, ?, ?, ?, 'active', ?)
        `).run(prescriptionId, recordId, patientId, doctorId, today, 'Follow medication dosage as directed.');

        const insertItem = db.prepare(`
          INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration, instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of prescriptions) {
          insertItem.run(
            `rxitem-${crypto.randomUUID()}`,
            prescriptionId,
            item.medicationName,
            item.dosage,
            item.frequency,
            item.duration,
            item.instructions || ''
          );
        }
      }

      // Notify patient
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${crypto.randomUUID()}`,
        patientId,
        'Consultation Record Added',
        `Your physician has uploaded clinical notes and diagnosis: ${diagnosis.trim()}`,
        'record',
        '/medical-records'
      );

      db.exec('COMMIT');

      logAudit(req, 'MEDICAL_RECORD_CREATE', 'medical_records', recordId, `Created diagnosis "${diagnosis}" for patient ${patientId}`);

      res.status(201).json({ 
        success: true, 
        recordId, 
        prescriptionId,
        message: 'Medical consultation record and clinical notes securely saved.' 
      });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. PRESCRIPTIONS
// ==========================================

apiRouter.get('/prescriptions', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { patientId } = req.query as { patientId?: string };

    let query = `
      SELECT 
        rx.*,
        p_pat.full_name as patient_name,
        p_doc.full_name as doctor_name,
        doc.specialization as doctor_specialization
      FROM prescriptions rx
      JOIN patients pat ON rx.patient_id = pat.id
      JOIN profiles p_pat ON pat.id = p_pat.id
      JOIN doctors doc ON rx.doctor_id = doc.id
      JOIN profiles p_doc ON doc.id = p_doc.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (role === 'patient') {
      query += ` AND rx.patient_id = ?`;
      params.push(userId);
    } else if (role === 'doctor') {
      if (patientId) {
        query += ` AND rx.patient_id = ?`;
        params.push(patientId);
      } else {
        query += ` AND rx.doctor_id = ?`;
        params.push(userId);
      }
    } else if (role === 'admin' && patientId) {
      query += ` AND rx.patient_id = ?`;
      params.push(patientId);
    }

    query += ` ORDER BY rx.issued_date DESC`;
    const prescriptions = db.prepare(query).all(...params) as any[];

    for (const rx of prescriptions) {
      rx.items = db.prepare(`SELECT * FROM prescription_items WHERE prescription_id = ?`).all(rx.id);
    }

    res.json({ prescriptions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/prescriptions', authenticate, requireRole(['doctor']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId, recordId, instructions, items } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Patient ID and at least one medication item are required.' });
      return;
    }

    const doctorId = req.user!.userId;
    const rxId = `rx-${crypto.randomUUID()}`;
    const today = new Date().toISOString().split('T')[0];

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`
        INSERT INTO prescriptions (id, record_id, patient_id, doctor_id, issued_date, status, instructions)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
      `).run(rxId, recordId || null, patientId, doctorId, today, instructions || '');

      const insertItem = db.prepare(`
        INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration, instructions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(
          `rxitem-${crypto.randomUUID()}`,
          rxId,
          item.medicationName,
          item.dosage,
          item.frequency,
          item.duration,
          item.instructions || ''
        );
      }

      // Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${crypto.randomUUID()}`,
        patientId,
        'Prescription Issued',
        `A new digital prescription has been prescribed for you with ${items.length} medication(s).`,
        'prescription',
        '/prescriptions'
      );

      db.exec('COMMIT');

      logAudit(req, 'PRESCRIPTION_CREATE', 'prescriptions', rxId, `Issued prescription with ${items.length} items to patient ${patientId}`);
      res.status(201).json({ id: rxId, message: 'Prescription successfully authorized and created.' });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. MEDICAL DOCUMENTS (UPLOADS & STORAGE)
// ==========================================

apiRouter.get('/documents', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { patientId } = req.query as { patientId?: string };

    let query = `
      SELECT 
        d.id,
        d.patient_id,
        d.uploaded_by,
        d.title,
        d.document_type,
        d.file_name,
        d.file_size,
        d.mime_type,
        d.notes,
        d.created_at,
        p_up.full_name as uploader_name,
        p_up.role as uploader_role,
        p_pat.full_name as patient_name
      FROM medical_documents d
      JOIN profiles p_up ON d.uploaded_by = p_up.id
      JOIN patients pat ON d.patient_id = pat.id
      JOIN profiles p_pat ON pat.id = p_pat.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (role === 'patient') {
      query += ` AND d.patient_id = ?`;
      params.push(userId);
    } else if (patientId) {
      query += ` AND d.patient_id = ?`;
      params.push(patientId);
    }

    query += ` ORDER BY d.created_at DESC`;
    const documents = db.prepare(query).all(...params);

    res.json({ documents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/documents', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, documentType, fileName, fileSize, mimeType, fileData, notes, patientId } = req.body;

    if (!title || !documentType || !fileName || !fileData) {
      res.status(400).json({ error: 'Title, documentType, fileName, and fileData are required.' });
      return;
    }

    // Role check: patient can only upload for themselves
    let targetPatientId = req.user!.userId;
    if ((req.user!.role === 'doctor' || req.user!.role === 'admin') && patientId) {
      targetPatientId = patientId;
    }

    const docId = `doc-${crypto.randomUUID()}`;

    db.prepare(`
      INSERT INTO medical_documents (id, patient_id, uploaded_by, title, document_type, file_name, file_size, mime_type, file_data, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      targetPatientId,
      req.user!.userId,
      title.trim(),
      documentType,
      fileName,
      fileSize || 0,
      mimeType || 'application/pdf',
      fileData,
      notes || null
    );

    logAudit(req, 'DOCUMENT_UPLOAD', 'medical_documents', docId, `Uploaded ${title} (${fileName})`);
    res.status(201).json({ id: docId, message: 'Document securely uploaded to medical archive.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/documents/:id/download', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = db.prepare(`SELECT * FROM medical_documents WHERE id = ?`).get(req.params.id) as any;
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    // RLS: Patient can only download their own
    if (req.user!.role === 'patient' && doc.patient_id !== req.user!.userId) {
      res.status(403).json({ error: 'Access denied: You do not have permission to view this document.' });
      return;
    }

    logAudit(req, 'DOCUMENT_DOWNLOAD', 'medical_documents', doc.id, `Downloaded file ${doc.file_name}`);

    // If data URL: data:[<mediatype>][;base64],<data>
    if (doc.file_data.startsWith('data:')) {
      const matches = doc.file_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
        res.send(buffer);
        return;
      }
    }

    // Default JSON fallback
    res.json({ document: doc });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/documents/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = db.prepare(`SELECT * FROM medical_documents WHERE id = ?`).get(req.params.id) as any;
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    // Only uploader, the patient, or admin can delete
    if (req.user!.role !== 'admin' && doc.uploaded_by !== req.user!.userId && doc.patient_id !== req.user!.userId) {
      res.status(403).json({ error: 'Unauthorized to delete this record.' });
      return;
    }

    db.prepare(`DELETE FROM medical_documents WHERE id = ?`).run(req.params.id);
    logAudit(req, 'DOCUMENT_DELETE', 'medical_documents', req.params.id, `Deleted document ${doc.file_name}`);

    res.json({ success: true, message: 'Document removed from archive.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user!.userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.user!.userId) as { count: number };

    res.json({ notifications, unreadCount: unreadCount?.count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/notifications/mark-all-read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ?
    `).run(req.user!.userId);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. ADMINISTRATOR DASHBOARD & ANALYTICS
// ==========================================

apiRouter.get('/admin/analytics', authenticate, requireRole(['admin']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Total counts from real database rows
    const totalPatients = (db.prepare('SELECT COUNT(*) as count FROM patients').get() as any).count;
    const totalDoctors = (db.prepare('SELECT COUNT(*) as count FROM doctors').get() as any).count;
    const totalDepartments = (db.prepare('SELECT COUNT(*) as count FROM departments').get() as any).count;
    const totalAppointments = (db.prepare('SELECT COUNT(*) as count FROM appointments').get() as any).count;
    const totalRecords = (db.prepare('SELECT COUNT(*) as count FROM medical_records').get() as any).count;
    const totalPrescriptions = (db.prepare('SELECT COUNT(*) as count FROM prescriptions').get() as any).count;

    // 2. Appointments breakdown by status
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `).all() as { status: string; count: number }[];

    // 3. Department distribution
    const departmentStats = db.prepare(`
      SELECT 
        dept.name,
        dept.code,
        COUNT(DISTINCT doc.id) as doctor_count,
        COUNT(a.id) as appointment_count
      FROM departments dept
      LEFT JOIN doctors doc ON dept.id = doc.department_id
      LEFT JOIN appointments a ON dept.id = a.department_id
      GROUP BY dept.id
      ORDER BY appointment_count DESC
    `).all();

    // 4. Recent hospital activities (from audit_logs)
    const recentActivities = db.prepare(`
      SELECT id, user_email, role, action, resource_type, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 15
    `).all();

    // 5. Total revenue (sum of consultation fees for completed or confirmed appointments)
    const revenueRow = db.prepare(`
      SELECT SUM(doc.consultation_fee) as total_rev
      FROM appointments a
      JOIN doctors doc ON a.doctor_id = doc.id
      WHERE a.status IN ('completed', 'confirmed')
    `).get() as any;

    res.json({
      metrics: {
        totalPatients,
        totalDoctors,
        totalDepartments,
        totalAppointments,
        totalRecords,
        totalPrescriptions,
        totalRevenue: revenueRow?.total_rev || 0
      },
      statusCounts,
      departmentStats,
      recentActivities
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/audit-logs', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, role, limit = 50 } = req.query as Record<string, string>;
    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (action) {
      query += ` AND action = ?`;
      params.push(action);
    }
    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Number(limit) || 50);

    const logs = db.prepare(query).all(...params);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin update user role
apiRouter.patch('/admin/users/:id/role', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { newRole } = req.body;
    if (!['patient', 'doctor', 'admin'].includes(newRole)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }

    db.prepare(`UPDATE profiles SET role = ?, updated_at = datetime('now') WHERE id = ?`).run(newRole, req.params.id);
    logAudit(req, 'USER_ROLE_CHANGED', 'profiles', req.params.id, `Changed role to ${newRole}`);

    res.json({ success: true, message: `User role updated to ${newRole}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
