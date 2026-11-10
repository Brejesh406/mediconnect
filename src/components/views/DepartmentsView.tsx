import React, { useEffect, useState } from 'react';
import { HeartPulse, Brain, Bone, Eye, Baby, Smile, Building2, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Department, DoctorListItem } from '../../types';

interface DepartmentsViewProps {
  onSelectDoctor: (doctorId: string, deptId?: string) => void;
  onBookAppointment: (deptId?: string) => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({ onSelectDoctor, onBookAppointment }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDepartments(), api.getDoctors()])
      .then(([deptRes, docRes]) => {
        setDepartments(deptRes.departments);
        setDoctors(docRes.doctors);
      })
      .finally(() => setLoading(false));
  }, []);

  const getDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="w-6 h-6 text-rose-600" />;
      case 'Brain': return <Brain className="w-6 h-6 text-indigo-600" />;
      case 'Bone': return <Bone className="w-6 h-6 text-amber-600" />;
      case 'Eye': return <Eye className="w-6 h-6 text-sky-600" />;
      case 'Baby': return <Baby className="w-6 h-6 text-teal-600" />;
      case 'Smile': return <Smile className="w-6 h-6 text-emerald-600" />;
      default: return <Building2 className="w-6 h-6 text-teal-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-2xl mb-12">
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
          Hospital Clinical Divisions
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Specialized Medical Departments
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Our specialized clinics operate with accredited clinical teams, state-of-the-art diagnostic imaging suites, and coordinated electronic health records.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading hospital divisions...</div>
      ) : (
        <div className="space-y-8">
          {departments.map((dept) => {
            const deptDocs = doctors.filter(d => d.department_id === dept.id);
            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                    {getDeptIcon(dept.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-bold text-slate-900">{dept.name}</h2>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mb-3">
                      {dept.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>Floor: <strong>{dept.location_floor}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Head: <strong>{dept.head_doctor_name || 'Chief Physician'}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Accredited Physicians: <strong>{deptDocs.length}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    onClick={() => onBookAppointment(dept.id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    Schedule in {dept.name} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
