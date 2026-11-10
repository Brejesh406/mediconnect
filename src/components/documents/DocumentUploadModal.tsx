import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
}) => {
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<'lab_result' | 'radiology' | 'discharge_summary' | 'insurance' | 'prescription_scan' | 'other'>('lab_result');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB maximum limit.');
      return;
    }

    setFile(selected);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target?.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file || !fileData) {
      setError('Please provide document title and select a valid file.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await api.uploadDocument({
        title,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        fileData,
        notes,
        patientId,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Document upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold">Secure Health Document Upload</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Document encrypted and saved to medical record archive!</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chest CT Scan, Fasting Blood Glucose, Dental X-Ray"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
            <select
              value={documentType}
              onChange={(e: any) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="lab_result">Diagnostic Lab Result</option>
              <option value="radiology">Radiology / Imaging (X-Ray, MRI, CT)</option>
              <option value="discharge_summary">Hospital Discharge Summary</option>
              <option value="insurance">Insurance Claim & ID Card</option>
              <option value="prescription_scan">Prescription Scan</option>
              <option value="other">General Clinical Documentation</option>
            </select>
          </div>

          {/* File input area */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select File (PDF, PNG, JPG)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-teal-500 transition-colors bg-slate-50">
              <input
                type="file"
                id="doc-file-input"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-8 h-8 text-teal-600 mb-2" />
                {file ? (
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-teal-700">Click to choose a file</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF or Image scans up to 25MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Conducted at Regional Medical Imaging Center under Dr. Jensen's referral"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !title}
              className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {uploading ? 'Encrypting & Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
