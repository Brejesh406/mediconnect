import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { Department, DoctorListItem } from '../../types';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedDoctorId?: string;
  preselectedDepartmentId?: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedDoctorId,
  preselectedDepartmentId,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(preselectedDepartmentId || '');
  const [selectedDocId, setSelectedDocId] = useState<string>(preselectedDoctorId || '');
  
  // Date calculation: Default to tomorrow or next business day
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [appointmentDate, setAppointmentDate] = useState<string>(getTomorrowDate());
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string; isAvailable: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Load initial departments & doctors
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      api.getDepartments().then(res => setDepartments(res.departments)).catch(console.error);
      api.getDoctors().then(res => setDoctors(res.doctors)).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedDoctorId) setSelectedDocId(preselectedDoctorId);
    if (preselectedDepartmentId) setSelectedDeptId(preselectedDepartmentId);
  }, [preselectedDoctorId, preselectedDepartmentId]);

  // Fetch slots whenever doctor and date change
  useEffect(() => {
    if (!selectedDocId || !appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot('');
    setError(null);

    api.getAvailableSlots(selectedDocId, appointmentDate)
      .then(res => {
        setAvailableSlots(res.slots);
      })
      .catch(err => {
        setError(err.message || 'Failed to load doctor slots.');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDocId, appointmentDate]);

  if (!isOpen) return null;

  const filteredDoctors = selectedDeptId
    ? doctors.filter(d => d.department_id === selectedDeptId)
    : doctors;

  const selectedDoctor = doctors.find(d => d.id === selectedDocId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !appointmentDate || !selectedSlot || !reasonForVisit) {
      setError('Please choose a doctor, date, available time slot, and reason for visit.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await api.bookAppointment({
        doctorId: selectedDocId,
        departmentId: selectedDeptId || selectedDoctor?.department_id,
        appointmentDate,
        startTime: selectedSlot,
        reasonForVisit,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base font-bold">Schedule Clinical Consultation</h3>
              <p className="text-xs text-slate-400">Guaranteed real-time slot reservation</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Appointment successfully booked! Notification sent to doctor and your portal.</span>
            </div>
          )}

          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" /> Medical Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedDocId('');
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="">All Departments (Browse all specialists)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" /> Attending Physician
            </label>
            <select
              required
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="">-- Choose Physician --</option>
              {filteredDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} – {doc.specialization} (${doc.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          {selectedDoctor && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">{selectedDoctor.full_name}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span>{selectedDoctor.room_number}</span>
              </div>
              <div className="font-mono tabular-nums font-semibold text-teal-700">
                Fee: ${selectedDoctor.consultation_fee.toFixed(2)}
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Preferred Consultation Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Available Time Slots Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" /> Available Time Slot
            </label>

            {loadingSlots ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Checking physician calendar in real time...
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="py-4 px-3 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                No slots open on this date. Please choose another weekday (Mon–Fri).
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.startTime;
                  const isAvailable = slot.isAvailable;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot.startTime)}
                      className={`py-2 px-1 text-xs rounded-lg font-mono tabular-nums font-medium transition-colors border ${
                        !isAvailable
                          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Visit / Primary Symptoms
            </label>
            <textarea
              required
              rows={3}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="e.g. Follow-up consultation for blood pressure medication, chest tightness, or joint review"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot || !reasonForVisit}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {submitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
