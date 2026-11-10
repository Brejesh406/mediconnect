import React, { useEffect, useState } from 'react';
import { Search, Stethoscope, Calendar, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { DoctorListItem, Department } from '../../types';

interface DoctorsViewProps {
  onSelectDoctor: (doctorId: string, deptId?: string) => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({ onSelectDoctor }) => {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDoctors(), api.getDepartments()])
      .then(([docRes, deptRes]) => {
        setDoctors(docRes.doctors);
        setDepartments(deptRes.departments);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(doc => {
    const matchesSearch = 
      doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || doc.department_id === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-2xl mb-8">
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
          Medical Staff Roster
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Find a Clinical Specialist
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Schedule with our board-certified physicians, department heads, and attending surgeons.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by physician name or specialty..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
          />
        </div>

        {/* Interactive Segmented Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedDept === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Specialties
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                selectedDept === d.id ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading specialist directory...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          No specialists match your criteria. Please refine your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  {doc.avatar_url ? (
                    <img
                      src={doc.avatar_url}
                      alt={doc.full_name}
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                      <UserCheck className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-mono text-white">
                    {doc.room_number}
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                    {doc.department_name}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{doc.full_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{doc.specialization}</p>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {doc.bio}
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500">
                    Qualifications: <strong>{doc.qualifications}</strong>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-600 block">Consultation Fee</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      ${doc.consultation_fee.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectDoctor(doc.id, doc.department_id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book Consultation
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
