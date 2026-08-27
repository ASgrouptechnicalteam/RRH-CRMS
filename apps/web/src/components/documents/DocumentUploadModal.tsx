import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { DocumentType, DOCUMENT_TYPE_ENTITY_REQUIREMENTS } from '@rrh-ems/shared';
import { JsonValue } from '../../types';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ENTITY_LABELS: Record<string, string> = {
  customer_id: 'Customer',
  lead_id: 'Lead',
  opportunity_id: 'Opportunity',
  booking_id: 'Booking',
  property_id: 'Property',
  project_id: 'Project',
  payment_id: 'Payment',
};

const ENTITY_ENDPOINTS: Record<string, string> = {
  customer_id: 'customers',
  lead_id: 'leads',
  opportunity_id: 'opportunities',
  booking_id: 'bookings',
  property_id: 'properties',
  project_id: 'projects',
  payment_id: 'payments',
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentUploadModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [entityIds, setEntityIds] = useState<Record<string, number | undefined>>({});
  const [entityOptions, setEntityOptions] = useState<Record<string, { id: number; label: string }[]>>({});
  const [loadingEntities, setLoadingEntities] = useState<Record<string, boolean>>({});

  const requirements = documentType ? DOCUMENT_TYPE_ENTITY_REQUIREMENTS[documentType] : null;
  const requiredFields = requirements?.required || [];
  const optionalFields = requirements?.optional || [];

  useEffect(() => {
    if (!documentType) return;
    const allFields = [...new Set([...requiredFields, ...optionalFields])];
    allFields.forEach((field) => {
      if (entityOptions[field]) return;
      const endpoint = ENTITY_ENDPOINTS[field];
      if (!endpoint) return;
      setLoadingEntities((prev) => ({ ...prev, [field]: true }));
      fetchWithAuth(`${API_BASE_URL}/${endpoint}?limit=100`)
        .then((res) => res.json())
        .then((data: Record<string, JsonValue>) => {
          const raw = Array.isArray(data) ? (data as JsonValue[]) : (data.customers || data.leads || data.bookings || data.properties || data.projects || data.payments || data.opportunities || []);
          const items = (raw as JsonValue[]).map((item: JsonValue) => ({
            id: (item as { id?: number }).id ?? 0,
            label: (item as { customer_code?: string; lead_code?: string; booking_code?: string; property_code?: string; project_code?: string; payment_code?: string; opportunity_code?: string; id?: number }).customer_code
              || (item as { lead_code?: string }).lead_code
              || (item as { booking_code?: string }).booking_code
              || (item as { property_code?: string }).property_code
              || (item as { project_code?: string }).project_code
              || (item as { payment_code?: string }).payment_code
              || (item as { opportunity_code?: string }).opportunity_code
              || `#${String((item as { id?: number }).id ?? 0)}`,
          }));
          setEntityOptions((prev) => ({ ...prev, [field]: items }));
        })
        .catch(() => {})
        .finally(() => setLoadingEntities((prev) => ({ ...prev, [field]: false })));
    });
  }, [documentType, requiredFields, optionalFields, fetchWithAuth, entityOptions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = '.' + selected.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('File type not allowed. Allowed: ' + ALLOWED_EXTENSIONS.join(', '));
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('File size must be under 10MB.');
      return;
    }

    setFile(selected);
    setError('');

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!documentType) { setError('Document type is required.'); return; }
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!file) { setError('File is required.'); return; }

    for (const field of requiredFields) {
      if (!entityIds[field]) {
        setError(`${ENTITY_LABELS[field] || field} is required for this document type.`);
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('title', title.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      Object.entries(entityIds).forEach(([field, value]) => {
        if (value) formData.append(field, value.toString());
      });

      formData.append('file', file);

      const res = await fetchWithAuth(`${API_BASE_URL}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        showToast('Document uploaded successfully.', 'success');
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to upload document.');
      }
    } catch {
      showToast('An error occurred during upload.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-600" />
            Upload Document
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Document Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => { setDocumentType(e.target.value); setEntityIds({}); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select document type</option>
              {Object.values(DocumentType).map((type) => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Entity Selectors */}
          {documentType && requiredFields.map((field) => (
            <div key={field}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {ENTITY_LABELS[field] || field} *
              </label>
              <select
                value={entityIds[field] || ''}
                onChange={(e) => setEntityIds((prev) => ({ ...prev, [field]: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                disabled={loadingEntities[field]}
              >
                <option value="">{loadingEntities[field] ? 'Loading...' : `Select ${ENTITY_LABELS[field]}`}</option>
                {(entityOptions[field] || []).map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
          ))}

          {documentType && optionalFields.filter((f) => !requiredFields.includes(f)).map((field) => (
            <div key={field}>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {ENTITY_LABELS[field] || field} (optional)
              </label>
              <select
                value={entityIds[field] || ''}
                onChange={(e) => setEntityIds((prev) => ({ ...prev, [field]: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                disabled={loadingEntities[field]}
              >
                <option value="">None</option>
                {(entityOptions[field] || []).map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
          ))}

          {/* File */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">File *</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
            >
              {file ? (
                <div className="flex items-center gap-3">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                      <FileText className="w-7 h-7 text-teal-600" />
                    </div>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-slate-400">
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xs font-semibold">Click to select file</p>
                  <p className="text-[10px] text-slate-400">PDF, JPG, JPEG, PNG, WEBP (max 10MB)</p>
                </div>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !documentType || !title.trim() || !file}
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
