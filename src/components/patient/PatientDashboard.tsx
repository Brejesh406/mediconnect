import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Pill, 
  UploadCloud, 
  User, 
  Clock, 
  XCircle, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Heart, 
  Activity, 
  Building2, 
  Download, 
  Eye, 
  Phone, 
  Shield 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  Appointment, 
  MedicalRecord, 
  Prescription, 
  MedicalDocument, 
  DoctorListItem, 
  Department 
} from '../../types';
import { BookAppointmentModal } from '../appointments/BookAppointmentModal';
import { MedicalRecordDetailModal } from '../records/MedicalRecordDetailModal';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';

export const PatientDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'records' | 'documents' | 'profile'>('appointments');
  
  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Edit form states
  const [phone, setPhone] = useState(user?.phone || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.patient?.emergency_contact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.patient?.emergency_phone || '');
  const [address, setAddress] = useState(user?.patient?.address || '');
  const [allergies, setAllergies] = useState(user?.patient?.allergies || '');
  const [chronicConditions, setChronicConditions] = useState(user?.patient?.chronic_conditions || '');
  const [insuranceProvider, setInsuranceProvider] = useState(user?.patient?.insurance_provider || '');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(user?.patient?.insurance_policy_number || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, rxRes, recsRes, docsRes, docsListRes, deptsRes] = await Promise.all([
        api.getAppointments(),
        api.getPrescriptions(),
        api.getMedicalRecords(),
        api.getDocuments(),
        api.getDoctors(),
        api.getDepartments(),
      ]);

      setAppointments(apptsRes.appointments);
      setPrescriptions(rxRes.prescriptions);
      setRecords(recsRes.records);
      setDocuments(docsRes.documents);
      setDoctors(docsListRes.doctors);
      setDepartments(deptsRes.departments);
    } catch (err: any) {
      console.error('Failed to load patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelAppointment = async (apptId: string) => {
    const reason = prompt('Please specify cancellation reason:');
    if (!reason) return;

    try {
      await api.updateAppointmentStatus(apptId, 'cancelled', reason);
      setActionMessage({ type: 'success', text: 'Appointment has been cancelled successfully.' });
      loadData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to cancel appointment.' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({
        phone,
        emergencyContact,
        emergencyPhone,
        address,
        allergies,
        chronicConditions,
        insuranceProvider,
        insurancePolicyNumber,
      });
      await refreshUser();
      setActionMessage({ type: 'success', text: 'Health profile updated successfully.' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDownloadDoc = (docId: string, fileName: string) => {
    // Open authenticated document endpoint
    const token = localStorage.getItem('mediconnect_token');
    window.open(`/api/documents/${docId}/download?token=${token}`, '_blank');
  };

  const upcomingAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const pastAppts = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xl">
            {user?.fullName?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.fullName}</h1>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                Verified Patient
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              MRN: <span className="font-mono">{user?.id?.slice(0, 12)}</span> · Blood: {user?.patient?.blood_group || 'O+'} · Insurance: {user?.patient?.insurance_provider || 'Direct Care'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" /> Upload File
          </button>
          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Prescriptions</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {prescriptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'records'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Clinical Records</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Health Documents</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Medical Profile</span>
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-8">
          {/* Upcoming Consultations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Consultations</h3>
              <button
                onClick={() => setShowBookModal(true)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule New
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading schedule...</div>
            ) : upcomingAppts.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Upcoming Consultations</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  You have no pending or confirmed appointments. Schedule a visit with our specialists in any department.
                </p>
                <button
                  onClick={() => setShowBookModal(true)}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Schedule an Appointment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                          {appt.department_name} ({appt.department_code})
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                          appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {appt.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{appt.doctor_name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{appt.doctor_specialization}</p>

                      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" /> Date:
                          </span>
                          <span className="font-mono tabular-nums font-semibold">{appt.appointment_date}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-teal-600" /> Time:
                          </span>
                          <span className="font-mono tabular-nums font-semibold">{appt.start_time} - {appt.end_time}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" /> Location:
                          </span>
                          <span className="font-semibold">{appt.doctor_room || 'Clinic Suite'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 italic">
                        "{appt.reason_for_visit}"
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 font-mono">
                        ID: {appt.id.slice(0, 8)}
                      </span>
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past / Encounter History */}
          {pastAppts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Past Consultations & Encounters</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Physician & Dept</th>
                      <th className="py-3 px-4">Visit Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastAppts.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono tabular-nums">
                          <div>{appt.appointment_date}</div>
                          <div className="text-[11px] text-slate-600">{appt.start_time}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{appt.doctor_name}</div>
                          <div className="text-[11px] text-slate-600">{appt.department_name}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {appt.reason_for_visit}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            appt.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {appt.status === 'completed' && (
                            <button
                              onClick={() => {
                                const matchingRec = records.find(r => r.appointment_id === appt.id);
                                if (matchingRec) setSelectedRecord(matchingRec);
                                else setActiveTab('records');
                              }}
                              className="text-teal-700 hover:text-teal-900 font-semibold"
                            >
                              View Notes
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active & Historical Prescriptions</h3>
              <p className="text-xs text-slate-500">Electronically signed and authorized by attending physicians.</p>
            </div>
          </div>

          {prescriptions.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
              <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Prescriptions On File</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Prescriptions issued during consultations will automatically appear here with dosage and frequency details.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono tabular-nums text-slate-600">
                        Issued: {rx.issued_date}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                        rx.status === 'active' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rx.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-900">Prescribing Physician: {rx.doctor_name}</h4>
                      <p className="text-[11px] text-slate-500">{rx.doctor_specialization}</p>
                    </div>

                    {/* Medications List */}
                    <div className="space-y-2 border-t border-b border-slate-100 py-3 my-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                        Prescribed Medications
                      </span>
                      {rx.items?.map((item) => (
                        <div key={item.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{item.medication_name}</span>
                            <span className="font-mono text-slate-700">{item.dosage}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 text-[11px] mt-1">
                            <span>Frequency: {item.frequency}</span>
                            <span>Duration: {item.duration}</span>
                          </div>
                          {item.instructions && (
                            <p className="text-[11px] text-teal-800 mt-1 italic">
                              Note: {item.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {rx.instructions && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-700">Physician Directives:</span> {rx.instructions}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                    <span>Rx ID: {rx.id}</span>
                    <span>Hospital Pharmacy Approved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLINICAL RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verified Clinical Encounter Records</h3>
              <p className="text-xs text-slate-500">Official medical history, recorded physical exams, and vitals.</p>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Clinical Encounters Logged</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Encounter records compiled by your physicians following appointments will be stored here securely.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs tabular-nums font-semibold text-slate-500">
                        {rec.record_date}
                      </span>
                      <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        {rec.department_name}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      Diagnosis: {rec.diagnosis}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      <span className="font-semibold text-slate-700">Clinical Assessment:</span> {rec.clinical_notes}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Attending: <strong>{rec.doctor_name}</strong></span>
                      {rec.vitals_blood_pressure && (
                        <span>BP: <strong className="font-mono">{rec.vitals_blood_pressure}</strong></span>
                      )}
                      {rec.vitals_heart_rate && (
                        <span>HR: <strong className="font-mono">{rec.vitals_heart_rate} bpm</strong></span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRecord(rec)}
                    className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start md:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Encounter File
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Medical Document Archive</h3>
              <p className="text-xs text-slate-500">Laboratory scans, diagnostic radiology, and clinical uploads.</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
              <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Documents Uploaded</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Store your medical scans, discharge files, and outside lab results safely in your encrypted health record.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase text-teal-700">
                        {doc.document_type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-600">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mb-1">{doc.title}</h4>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{doc.file_name}</p>

                    {doc.notes && (
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 italic">
                        "{doc.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-600">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDownloadDoc(doc.id, doc.file_name)}
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROFILE MANAGEMENT */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Personal Health & Contact Profile</h3>
            <p className="text-xs text-slate-500">Keep your emergency contact, drug allergies, and insurance info current.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.fullName || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Mary Doe (Spouse)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  placeholder="e.g. Blue Cross Blue Shield"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Policy / Member Number</label>
                <input
                  type="text"
                  value={insurancePolicyNumber}
                  onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                  placeholder="e.g. BCBS-99482710"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Known Drug Allergies & Reactions</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Shellfish, Latex, Sulfa"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chronic Medical Conditions</label>
              <input
                type="text"
                value={chronicConditions}
                onChange={(e) => setChronicConditions(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      <BookAppointmentModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSuccess={loadData}
      />

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={loadData}
      />

      <MedicalRecordDetailModal
        isOpen={!!selectedRecord}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
};
