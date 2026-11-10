import React from 'react';
import { ShieldCheck, PhoneCall, MapPin, Clock, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-slate-900">MediConnect</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              One Patient. One Secure Health Record. Connecting patients, clinical specialists, and hospital operations in a unified, audited health network.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
              <HeartHandshake className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Certified Joint Commission Accreditation</span>
            </div>
          </div>

          {/* Col 2: Clinical Units */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Medical Specialties
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Cardiovascular Medicine</li>
              <li>Neurology & Neurosurgery</li>
              <li>Orthopedic Joint Care</li>
              <li>Ophthalmology & Vision Science</li>
              <li>Pediatrics & Neonatology</li>
              <li>Oral & Maxillofacial Dentistry</li>
            </ul>
          </div>

          {/* Col 3: Patient Services */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Patient Portal & Care
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Online Appointment Scheduling</li>
              <li>Diagnostic Lab & Imaging Reports</li>
              <li>Digital Prescription Archive</li>
              <li>Physician Availability Calendar</li>
              <li>Row-Level Security & Data Isolation</li>
              <li>Discharge Summaries</li>
            </ul>
          </div>

          {/* Col 4: Hospital Contact */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Hospital Operations
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Central Medical Complex, 500 Health Sciences Way, Metro City</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-mono tabular-nums">Emergency: +1 (800) 555-0199</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Outpatient Clinics: Mon – Fri 08:00 – 18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 MediConnect Hospital Systems. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>HIPAA-Compliant Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Strict Role-Based Authorization</span>
            <span aria-hidden="true">·</span>
            <span>Immutable Clinical Audit Trails</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
