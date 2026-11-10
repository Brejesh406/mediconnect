import React from 'react';
import { ShieldCheck, Lock, Database, FileCheck2, UserCheck, AlertTriangle } from 'lucide-react';

export const SecurityView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
          Healthcare Security & Access Governance
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Row-Level Security & Clinical Compliance Architecture
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          MediConnect is engineered according to production healthcare security standards. Clinical records, diagnoses, and patient files are isolated with strict server-side policy enforcement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Zero-Trust Role-Based Access (RBAC)</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            The frontend client never dictates permissions. Every API request validates authorization tokens on the server against the persistent user session.
          </p>
          <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">·</span>
              <span><strong>Patients:</strong> Can only query their personal appointments, prescriptions, and health uploads. Direct ID tampering results in HTTP 403 Forbidden.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">·</span>
              <span><strong>Physicians:</strong> Authorized exclusively for patients booked in their clinical queue to document medical notes, record vital signs, and sign prescriptions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">·</span>
              <span><strong>Administrators:</strong> Comprehensive operational oversight with mandatory logging of administrative interventions.</span>
            </li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Database-Enforced Integrity & Anti-Double-Booking</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Preventing race conditions and appointment overlap is enforced directly within the database engine through transactions and unique constraints.
          </p>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto mb-3">
            CREATE UNIQUE INDEX idx_active_appointment<br />
            ON appointments (doctor_id, appointment_date, start_time)<br />
            WHERE status NOT IN ('cancelled', 'rejected');
          </div>
          <p className="text-xs text-slate-500">
            Concurrent booking attempts on identical physician time slots trigger immediate rollback with client notification.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 mb-4">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Encrypted Document Archive</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Diagnostic PDFs, laboratory bloodwork scans, and discharge summaries are stored with MIME-type verification and private session-gated streaming.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unauthenticated direct access to files is blocked; all downloads require an active authenticated bearer token and are permanently recorded in the hospital audit trail.
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Immutable Audit Logging</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Every patient record access, diagnostic formulation, prescription creation, and security status change is preserved in the database audit log.
          </p>
          <div className="text-xs text-slate-600 space-y-1 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>LOG: USER_LOGIN · 192.168.1.45 · dr.jensen@mediconnect.health</div>
            <div>LOG: RECORD_CREATE · rec-001 · usr-pat-john</div>
            <div>LOG: PRESCRIPTION_CREATE · rx-001 · Lisinopril 10mg</div>
          </div>
        </div>
      </div>
    </div>
  );
};
