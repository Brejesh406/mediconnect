import React from 'react';
import { X, FileText, Activity, Heart, Thermometer, Wind, Calendar, User, Stethoscope } from 'lucide-react';
import { MedicalRecord } from '../../types';

interface MedicalRecordDetailModalProps {
  record: MedicalRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MedicalRecordDetailModal: React.FC<MedicalRecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base font-bold">Clinical Consultation Record</h3>
              <p className="text-xs text-slate-400">Authenticated Medical Encounter Documentation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-600 block">Encounter Date</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {record.record_date}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-600 block">Patient Name</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {record.patient_name || 'Patient'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-600 block">Attending Physician</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                {record.doctor_name || 'Physician'}
              </span>
            </div>
          </div>

          {/* Vitals Strip */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" /> Recorded Vital Signs
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-500" /> Blood Pressure
                </span>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {record.vitals_blood_pressure || '120/80 mmHg'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" /> Heart Rate
                </span>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {record.vitals_heart_rate ? `${record.vitals_heart_rate} bpm` : '72 bpm'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temperature
                </span>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {record.vitals_temperature ? `${record.vitals_temperature} °F` : '98.6 °F'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-sky-500" /> SpO2 Saturation
                </span>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {record.vitals_spo2 ? `${record.vitals_spo2}%` : '99%'}
                </p>
              </div>
            </div>
          </div>

          {/* Clinical Diagnosis */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Primary Diagnosis
            </h4>
            <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-lg text-teal-950 font-semibold text-sm">
              {record.diagnosis}
            </div>
          </div>

          {/* Presenting Symptoms */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Reported Symptoms
            </h4>
            <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
              {record.symptoms}
            </p>
          </div>

          {/* Clinical Notes & Physical Examination */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Clinical Assessment & Physical Exam
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-line text-slate-700">
              {record.clinical_notes}
            </div>
          </div>

          {/* Treatment Plan & Follow Up */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Treatment Plan & Recommendations
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-slate-700">
              {record.treatment_plan}
            </div>
            {record.follow_up_date && (
              <div className="mt-2 text-xs font-medium text-slate-600">
                Scheduled Follow-up Date: <span className="font-semibold text-slate-900 font-mono tabular-nums">{record.follow_up_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-600 font-mono">Record ID: {record.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
