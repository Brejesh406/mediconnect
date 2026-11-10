import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Building2, 
  Activity, 
  ShieldCheck, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  History 
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminAnalytics, Appointment, Department, DoctorListItem, AuditLog } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'appointments' | 'doctors' | 'patients' | 'departments' | 'audit'>('analytics');
  
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Department Modal
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptFloor, setDeptFloor] = useState('Level 1');
  const [creatingDept, setCreatingDept] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, apptsRes, docsRes, patsRes, deptsRes, auditRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAppointments(),
        api.getDoctors(),
        api.getPatients(),
        api.getDepartments(),
        api.getAuditLogs({ limit: 50 }),
      ]);

      setAnalytics(analyticsRes);
      setAppointments(apptsRes.appointments);
      setDoctors(docsRes.doctors);
      setPatients(patsRes.patients);
      setDepartments(deptsRes.departments);
      setAuditLogs(auditRes.logs);
    } catch (err: any) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: 'patient' | 'doctor' | 'admin') => {
    try {
      await api.updateUserRole(userId, newRole);
      setActionMessage({ type: 'success', text: `User role changed to ${newRole}.` });
      loadAllData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update role.' });
    }
  };

  const handleUpdateAppointment = async (apptId: string, status: string) => {
    try {
      await api.updateAppointmentStatus(apptId, status);
      setActionMessage({ type: 'success', text: `Appointment updated to ${status}.` });
      loadAllData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Status update failed.' });
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDept(true);
    try {
      await api.createDepartment({
        name: deptName,
        code: deptCode,
        description: deptDesc,
        head_doctor_name: deptHead,
        location_floor: deptFloor,
        icon: 'Building2'
      });
      setShowNewDeptModal(false);
      setActionMessage({ type: 'success', text: 'Department created successfully.' });
      loadAllData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to create department.' });
    } finally {
      setCreatingDept(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Hospital Administration & Operations</h1>
              <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live database monitoring · Role-based access governance · Hospital audit trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewDeptModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Department
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Hospital Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>All Appointments</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'doctors'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor Roster</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {doctors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'patients'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patients</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'departments'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments</span>
          <span className="ml-1 text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {departments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">Total Patients</span>
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {analytics.metrics.totalPatients}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Active medical records</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">Medical Staff</span>
                <Stethoscope className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {analytics.metrics.totalDoctors}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Assigned across 6 departments</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">Consultations</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {analytics.metrics.totalAppointments}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Tracked across all statuses</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase">Consultation Fees</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                ${analytics.metrics.totalRevenue.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Confirmed & completed encounters</span>
            </div>
          </div>

          {/* Department Load & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Department Volume & Utilization
              </h3>
              <div className="space-y-4">
                {analytics.departmentStats.map((dept) => (
                  <div key={dept.code} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{dept.name} ({dept.code})</span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {dept.appointment_count} appts · {dept.doctor_count} physician(s)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(15, (dept.appointment_count / Math.max(1, analytics.metrics.totalAppointments)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment Status Counts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" /> Appointment Pipeline Distribution
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {analytics.statusCounts.map((sc) => (
                  <div key={sc.status} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block capitalize">
                      {sc.status}
                    </span>
                    <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5 block">
                      {sc.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Database Consistency Check:</span> All figures above are dynamically aggregated using synchronous SQL queries directly on the persistent database.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Hospital Appointment Ledger</h3>
            <span className="text-xs text-slate-500">Admin oversight & status override</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Physician & Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <div className="font-semibold text-slate-900">{appt.appointment_date}</div>
                      <div className="text-[11px] text-slate-500">{appt.start_time}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{appt.patient_name}</div>
                      <div className="text-[11px] text-slate-500">{appt.patient_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{appt.doctor_name}</div>
                      <div className="text-[11px] text-slate-500">{appt.department_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold capitalize bg-slate-100 text-slate-700">
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {appt.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateAppointment(appt.id, 'completed')}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                        >
                          Complete
                        </button>
                      )}
                      {appt.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateAppointment(appt.id, 'cancelled')}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                        >
                          Cancel
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

      {/* TAB 3: DOCTOR ROSTER */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Hospital Medical Staff</h3>
            <span className="text-xs text-slate-500">{doctors.length} accredited physicians</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-indigo-700 uppercase">
                      {doc.department_name}
                    </span>
                    <span className="font-mono text-xs text-slate-500">{doc.room_number}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.full_name}</h4>
                  <p className="text-xs text-slate-500">{doc.title}</p>
                  <p className="text-[11px] text-slate-600 mt-2 font-mono">
                    Fee: ${doc.consultation_fee.toFixed(2)} · Experience: {doc.experience_years} yrs
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">{doc.email}</span>
                  <button
                    onClick={() => handleUpdateRole(doc.id, 'patient')}
                    className="text-amber-700 hover:text-amber-900 font-semibold text-[11px]"
                  >
                    Demote to Patient
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PATIENTS */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Registered Patient Base</h3>
            <span className="text-xs text-slate-500">{patients.length} patients in records</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Contact & Email</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Insurance Info</th>
                  <th className="py-3 px-4 text-right">Role Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {pat.full_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{pat.email}</div>
                      <div className="text-[11px] text-slate-500">{pat.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                      {pat.blood_group || 'O+'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {pat.insurance_provider || 'Direct'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleUpdateRole(pat.id, 'doctor')}
                        className="text-indigo-700 hover:text-indigo-900 font-semibold text-xs"
                      >
                        Promote to Doctor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Clinical Departments</h3>
            <button
              onClick={() => setShowNewDeptModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{dept.code}</span>
                    <span className="text-xs text-slate-500">{dept.location_floor}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{dept.name}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dept.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Head: <strong>{dept.head_doctor_name || 'Chief of Staff'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Hospital Security Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable chronological log of all clinical actions, logins, and downloads.</p>
            </div>
            <span className="font-mono text-xs text-slate-500">{auditLogs.length} events</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Initiator</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {log.created_at}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{log.user_email}</div>
                      <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">{log.role}</div>
                    </td>
                    <td className="py-3 px-4 text-indigo-700">
                      {log.resource_type}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.ip_address}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans max-w-sm truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW DEPARTMENT MODAL */}
      {showNewDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-indigo-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Medical Department</h3>
              <button onClick={() => setShowNewDeptModal(false)} className="text-indigo-200 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Dermatology"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. DERM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Clinical services and specialization scope..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Head Physician Name</label>
                <input
                  type="text"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  placeholder="e.g. Dr. Robert Hall, MD"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Floor / Suite</label>
                <input
                  type="text"
                  value={deptFloor}
                  onChange={(e) => setDeptFloor(e.target.value)}
                  placeholder="e.g. Level 2 - West Suite"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewDeptModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDept}
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
                >
                  {creatingDept ? 'Creating...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
