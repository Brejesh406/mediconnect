import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  HeartPulse, 
  Brain, 
  Bone, 
  Eye, 
  Baby, 
  Smile, 
  Calendar, 
  Lock, 
  Activity, 
  FileCheck2, 
  ArrowRight, 
  CheckCircle, 
  UserCheck 
} from 'lucide-react';
import { Department, DoctorListItem } from '../../types';
import { api } from '../../services/api';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSelectDoctor: (doctorId: string, deptId?: string) => void;
  onSelectTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onSelectDoctor,
  onSelectTab,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);

  useEffect(() => {
    api.getDepartments().then(res => setDepartments(res.departments)).catch(console.error);
    api.getDoctors().then(res => setDoctors(res.doctors)).catch(console.error);
  }, []);

  const getDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case 'Brain': return <Brain className="w-5 h-5 text-indigo-600" />;
      case 'Bone': return <Bone className="w-5 h-5 text-amber-600" />;
      case 'Eye': return <Eye className="w-5 h-5 text-sky-600" />;
      case 'Baby': return <Baby className="w-5 h-5 text-teal-600" />;
      case 'Smile': return <Smile className="w-5 h-5 text-emerald-600" />;
      default: return <HeartPulse className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Messaging & Primary Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-teal-700 uppercase mb-3">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Next-Generation Clinical Healthcare Infrastructure</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
                One Patient.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-sky-700">
                  One Secure Health Record.
                </span>
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl mb-8">
                MediConnect unites patients, physicians, and hospital administration into a high-integrity clinical ecosystem. Schedule consultations in real-time, review certified diagnoses, and access tamper-proof health history anywhere.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all flex items-center gap-2 hover:shadow-lg"
                >
                  Create Patient Record <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Clinician & Admin Sign In
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Row-Level Security</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Conflict-Free Slot Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Full Audit Trail Logging</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Hospital Image Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 group">
                <img
                  src="/src/assets/images/hero_hospital_reception_1794309471590.jpg"
                  alt="MediConnect Central Medical Center modern reception"
                  className="w-full h-80 sm:h-96 lg:h-[440px] object-cover transition-transform duration-500 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 mb-1">
                    <Activity className="w-3.5 h-3.5" /> Outpatient Care Hub
                  </div>
                  <h3 className="text-base font-bold">Central Health Sciences Complex</h3>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Live operational scheduling across 6 specialized departments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column KPI Bar */}
        <div className="bg-slate-50 border-t border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">6 Clinical</span>
              <span className="text-xs text-slate-500 mt-0.5">Accredited Hospital Departments</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-mono tabular-nums text-teal-700">100% Real-time</span>
              <span className="text-xs text-slate-500 mt-0.5">Overlapping Booking Prevention</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">Encrypted</span>
              <span className="text-xs text-slate-500 mt-0.5">Health Documents & Laboratory Scans</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">3-Role RBAC</span>
              <span className="text-xs text-slate-500 mt-0.5">Patient, Doctor & Administrator Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* MEDICAL DEPARTMENTS SECTION */}
      <section id="departments" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
              Clinical Specializations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospital Departments & Specialized Units
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Every medical department is equipped with certified specialists, automated appointment schedules, and direct digital prescription connectivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      {getDeptIcon(dept.icon)}
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {dept.code}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{dept.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {dept.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    <span>{dept.location_floor}</span>
                  </div>
                  <button
                    onClick={() => {
                      const firstDoc = doctors.find(d => d.department_id === dept.id);
                      if (firstDoc) {
                        onSelectDoctor(firstDoc.id, dept.id);
                      } else {
                        onSelectTab('doctors');
                      }
                    }}
                    className="font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors"
                  >
                    View Specialists <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIALISTS & PHYSICIANS SHOWCASE */}
      <section id="specialists" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
                Medical Staff
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Senior Attending Specialists
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Board-certified physicians available for scheduled in-person and specialized diagnostic consultations.
              </p>
            </div>
            <button
              onClick={() => onSelectTab('doctors')}
              className="mt-4 md:mt-0 text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start"
            >
              Browse Full Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {doc.avatar_url ? (
                    <img
                      src={doc.avatar_url}
                      alt={doc.full_name}
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                      <UserCheck className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-mono text-white">
                    {doc.room_number}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-teal-700 block uppercase tracking-wider">
                      {doc.department_name}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{doc.full_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{doc.specialization}</p>
                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-600 block">Fee</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        ${doc.consultation_fee.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectDoctor(doc.id, doc.department_id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY & DATA INTEGRITY SECTION */}
      <section id="security" className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-3 border border-teal-500/20">
              <Lock className="w-3.5 h-3.5" /> Enterprise Clinical Security Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital-Grade Data Isolation & Auditability
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Medical records represent the most sensitive records in human life. MediConnect enforces database-level Row Level Security, preventing cross-tenant leakage and ensuring verified access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Patient Isolation (RLS)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Patients can only ever query and retrieve their own consultation notes, prescriptions, and diagnostic lab scans. Server-side session validation rejects spoofed user IDs.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Clinical Role Delegation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Physicians have restricted clinical authorization to record diagnoses, configure prescription dosages, and inspect historical encounters for their registered appointments.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Immutable Audit Trails</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every login, diagnosis creation, document download, and role modification writes an immutable record to the audit log table capturing timestamps, IP addresses, and user roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-16 bg-gradient-to-br from-teal-700 via-teal-800 to-sky-900 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
            Experience Unified Hospital Management Today
          </h2>
          <p className="text-sm text-teal-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Register as a patient to schedule your upcoming consultation, or sign in as a doctor to manage patient queues and clinical encounter files.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-3 text-sm font-semibold text-teal-900 bg-white hover:bg-slate-100 rounded-xl shadow-md transition-colors"
            >
              Get Started with MediConnect
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-6 py-3 text-sm font-semibold text-white bg-teal-600/60 hover:bg-teal-600/80 border border-teal-400/40 rounded-xl transition-colors"
            >
              Access Existing Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
