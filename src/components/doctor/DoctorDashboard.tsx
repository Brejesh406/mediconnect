import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Pill, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Stethoscope, 
  Eye, 
  User, 
  Save 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment, MedicalRecord, Prescription } from '../../types';
import { MedicalRecordDetailModal } from '../records/MedicalRecordDetailModal';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedule' | 'patients' | 'records' | 'availability'>('schedule');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clinical Consultation Modal states
  const [showConsultModal, setShowConsultModal] = useState<boolean>(false);
  const [activeApptForConsult, setActiveApptForConsult] = useState<Appointment | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // New Record form
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [bp, setBp] = useState('120/80 mmHg');
  const [hr, setHr] = useState(72);
  const [temp, setTemp] = useState(98.6);
  const [spo2, setSpo2] = useState(99);

  // Prescription items within consultation
  const [prescriptionItems, setPrescriptionItems] = useState<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[]>([
    { medicationName: '', dosage: '', frequency: 'Once daily', duration: '30 days', instructions: '' }
  ]);
  const [submittingConsult, setSubmittingConsult] = useState(false);

  // Availability schedule editor state (days 1-5 Mon-Fri)
  const [editingAvailability, setEditingAvailability] = useState<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, patsRes, recsRes, rxRes, availRes] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
        api.getMedicalRecords(),
        api.getPrescriptions(),
        api.getDoctorAvailability(user!.id),
      ]);

      setAppointments(apptsRes.appointments);
      setPatients(patsRes.patients);
      setRecords(recsRes.records);
      setPrescriptions(rxRes.prescriptions);

      const avail = availRes.availability;
      setAvailability(avail);

      // Pre-fill availability editor days 0 to 6
      const days = [0, 1, 2, 3, 4, 5, 6].map(d => {
        const match = avail.find(a => a.day_of_week === d);
        return {
          dayOfWeek: d,
          startTime: match ? match.start_time : '09:00',
          endTime: match ? match.end_time : '17:00',
          isActive: match ? Boolean(match.is_active) : (d >= 1 && d <= 5)
        };
      });
      setEditingAvailability(days);

    } catch (err: any) {
      console.error('Doctor dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUpdateStatus = async (apptId: string, status: string) => {
    try {
      await api.updateAppointmentStatus(apptId, status);
      setActionMessage({ type: 'success', text: `Appointment marked as ${status}.` });
      loadData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Status update failed.' });
    }
  };

  const handleOpenConsultation = (appt: Appointment) => {
    setActiveApptForConsult(appt);
    setDiagnosis('');
    setSymptoms(appt.reason_for_visit);
    setClinicalNotes('');
    setTreatmentPlan('');
    setPrescriptionItems([{ medicationName: '', dosage: '', frequency: 'Once daily', duration: '30 days', instructions: '' }]);
    setShowConsultModal(true);
  };

  const handleAddMedication = () => {
    setPrescriptionItems(prev => [
      ...prev,
      { medicationName: '', dosage: '', frequency: 'Once daily', duration: '30 days', instructions: '' }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApptForConsult) return;

    setSubmittingConsult(true);
    try {
      const validMeds = prescriptionItems.filter(m => m.medicationName.trim().length > 0);

      await api.createMedicalRecord({
        patientId: activeApptForConsult.patient_id,
        appointmentId: activeApptForConsult.id,
        diagnosis,
        symptoms,
        clinicalNotes,
        treatmentPlan,
        followUpDate: followUpDate || undefined,
        vitalsBloodPressure: bp,
        vitalsHeartRate: Number(hr),
        vitalsTemperature: Number(temp),
        vitalsSpo2: Number(spo2),
        prescriptions: validMeds.length > 0 ? validMeds : undefined,
      });

      setShowConsultModal(false);
      setActionMessage({ type: 'success', text: 'Clinical record and prescriptions securely saved.' });
      loadData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to save consultation.' });
    } finally {
      setSubmittingConsult(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await api.updateDoctorAvailability(user!.id, editingAvailability);
      setActionMessage({ type: 'success', text: 'Clinical schedule updated successfully.' });
      loadData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update schedule.' });
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const pendingAppointments = appointments.filter(a => a.status === 'pending');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-xl">
            <Stethoscope className="w-7 h-7 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.fullName}</h1>
              <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                Attending Physician
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.doctor?.specialization || 'Clinical Specialist'} · {user?.doctor?.room_number || 'Room 312'} · Standard Fee: ${user?.doctor?.consultation_fee || '180'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Today's Appts</span>
            <span className="text-base font-bold text-slate-900">{todayAppointments.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Pending Reviews</span>
            <span className="text-base font-bold text-amber-600">{pendingAppointments.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Patients</span>
            <span className="text-base font-bold text-slate-900">{patients.length}</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2 text-xs ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Patient Consultations Queue</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'patients'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Registry</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'records'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Clinical Encounter Records</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'availability'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Schedule & Availability</span>
        </button>
      </div>

      {/* TAB 1: CONSULTATIONS QUEUE */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Assigned Patient Appointments</h3>
            <span className="text-xs text-slate-500">Sorted chronologically</span>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No appointments assigned yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Chief Complaint</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Clinical Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <div className="font-semibold text-slate-900">{appt.appointment_date}</div>
                        <div className="text-[11px] text-slate-500">{appt.start_time} - {appt.end_time}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{appt.patient_name}</div>
                        <div className="text-[11px] text-slate-500">Blood: {appt.patient_blood_group || 'O+'} · {appt.patient_phone || 'No phone'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs leading-relaxed">
                        {appt.reason_for_visit}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                          appt.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : appt.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : appt.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => handleOpenConsultation(appt)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors"
                          >
                            Add Notes & Rx
                          </button>
                        )}
                        {appt.status === 'completed' && (
                          <span className="text-[11px] text-slate-600 italic">Encounter Filed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PATIENT REGISTRY */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hospital Patient Directory</h3>
              <p className="text-xs text-slate-500">Authorized medical records, allergy profiles, and contact details.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((pat) => (
              <div key={pat.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] text-slate-600">MRN: {pat.id.slice(0, 10)}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                      {pat.blood_group || 'O+'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{pat.full_name}</h4>
                  <p className="text-xs text-slate-500">{pat.email}</p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-[11px] space-y-1 text-slate-600 border border-slate-100">
                    <div><strong>DOB:</strong> {pat.date_of_birth || 'Not recorded'}</div>
                    <div><strong>Phone:</strong> {pat.phone || 'None'}</div>
                    <div><strong>Allergies:</strong> <span className="text-rose-700 font-semibold">{pat.allergies || 'None recorded'}</span></div>
                    <div><strong>Insurance:</strong> {pat.insurance_provider || 'Private'}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{pat.total_records || 0} encounter(s)</span>
                  <span className="font-semibold text-sky-700">Authorized Access</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLINICAL ENCOUNTER RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">My Clinical Encounters Log</h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">{records.length} records</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {records.map((rec) => (
              <div key={rec.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tabular-nums text-slate-500">{rec.record_date}</span>
                    <span className="text-xs font-semibold text-slate-900">Patient: {rec.patient_name}</span>
                  </div>
                  <h4 className="text-sm font-bold text-teal-800">Diagnosis: {rec.diagnosis}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{rec.clinical_notes}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(rec)}
                  className="px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" /> View File
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AVAILABILITY & SCHEDULE */}
      {activeTab === 'availability' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Consultation Availability</h3>
              <p className="text-xs text-slate-500">Configure clinic hours for patient automated slot reservations.</p>
            </div>
            <button
              onClick={handleSaveAvailability}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Hours
            </button>
          </div>

          <div className="space-y-3">
            {editingAvailability.map((sched, idx) => (
              <div
                key={sched.dayOfWeek}
                className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  sched.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 w-32">
                  <input
                    type="checkbox"
                    checked={sched.isActive}
                    onChange={(e) => {
                      const updated = [...editingAvailability];
                      updated[idx].isActive = e.target.checked;
                      setEditingAvailability(updated);
                    }}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-900">{dayNames[sched.dayOfWeek]}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    disabled={!sched.isActive}
                    value={sched.startTime}
                    onChange={(e) => {
                      const updated = [...editingAvailability];
                      updated[idx].startTime = e.target.value;
                      setEditingAvailability(updated);
                    }}
                    className="px-2 py-1 rounded border border-slate-300 font-mono text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    disabled={!sched.isActive}
                    value={sched.endTime}
                    onChange={(e) => {
                      const updated = [...editingAvailability];
                      updated[idx].endTime = e.target.value;
                      setEditingAvailability(updated);
                    }}
                    className="px-2 py-1 rounded border border-slate-300 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONSULTATION & PRESCRIPTION MODAL */}
      {showConsultModal && activeApptForConsult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-base font-bold">Clinical Consultation Documentation</h3>
                  <p className="text-xs text-slate-400">Patient: {activeApptForConsult.patient_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConsultModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultation} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Vitals Input Strip */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-3">
                  Clinical Vital Signs
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      placeholder="120/80 mmHg"
                      className="w-full px-2 py-1.5 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={hr}
                      onChange={(e) => setHr(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Primary Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Mild Mitral Valve Regurgitation (ICD-10 I34.0)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Presenting Symptoms & Clinical History</label>
                <textarea
                  required
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Clinical Notes & Physical Examination</label>
                <textarea
                  required
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Auscultation findings, heart sounds, neurological reflexes..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Treatment Plan & Patient Orders</label>
                <textarea
                  required
                  rows={2}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Dietary changes, physical therapy schedule, laboratory orders..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* Prescription Items Section */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-teal-600" /> Prescribe Medications
                    </h4>
                    <p className="text-[11px] text-slate-500">Attach digital prescriptions directly to this encounter.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medication
                  </button>
                </div>

                <div className="space-y-3">
                  {prescriptionItems.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Medication #{idx + 1}</span>
                        {prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Drug Name (e.g. Lisinopril)"
                          value={med.medicationName}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].medicationName = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="px-2 py-1.5 bg-white rounded border border-slate-300"
                        />
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 10mg)"
                          value={med.dosage}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].dosage = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="px-2 py-1.5 bg-white rounded border border-slate-300"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (e.g. Once daily)"
                          value={med.frequency}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].frequency = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="px-2 py-1.5 bg-white rounded border border-slate-300"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g. 30 days)"
                          value={med.duration}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].duration = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="px-2 py-1.5 bg-white rounded border border-slate-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConsultModal(false)}
                  className="px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConsult || !diagnosis}
                  className="px-5 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg shadow-sm"
                >
                  {submittingConsult ? 'Encrypting & Saving...' : 'Sign & Complete Encounter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <MedicalRecordDetailModal
        isOpen={!!selectedRecord}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
};
