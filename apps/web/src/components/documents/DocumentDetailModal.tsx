import React, { useState, useEffect, useRef } from 'react';
import { X, Download, CheckCircle, XCircle, Archive, RotateCcw, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Permissions } from '@rrh-ems/shared';
import { DocumentVerifyModal } from './DocumentVerifyModal';

interface DocumentDetail {
  id: number;
  document_code: string;
  company_id: number;
  branch_id: number | null;
  customer_id: number | null;
  lead_id: number | null;
  opportunity_id: number | null;
  booking_id: number | null;
  property_id: number | null;
  project_id: number | null;
  payment_id: number | null;
  document_type: string;
  title: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  status: string;
  verification_status: string;
  verified_by_id: number | null;
  verified_at: string | null;
  verification_notes: string | null;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
}

const TYPE_LABELS: Record<string, string> = {
  KYC_PAN: 'KYC PAN',
  KYC_AADHAAR: 'KYC Aadhaar',
  BOOKING_AGREEMENT: 'Booking Agreement',
  PAYMENT_RECEIPT: 'Payment Receipt',
  BOOKING_RECEIPT: 'Booking Receipt',
  SALE_DEED: 'Sale Deed',
  PROPERTY_TITLE: 'Property Title',
  PROPERTY_PLAN: 'Property Plan',
  PROPOSAL: 'Proposal',
  OTHER: 'Other',
};

const TYPE_COLORS: Record<string, string> = {
  KYC_PAN: 'bg-amber-100 text-amber-800',
  KYC_AADHAAR: 'bg-orange-100 text-orange-800',
  BOOKING_AGREEMENT: 'bg-navy-100 text-navy-800',
  PAYMENT_RECEIPT: 'bg-green-100 text-green-800',
  BOOKING_RECEIPT: 'bg-emerald-100 text-emerald-800',
  SALE_DEED: 'bg-purple-100 text-purple-800',
  PROPERTY_TITLE: 'bg-navy-100 text-navy-800',
  PROPERTY_PLAN: 'bg-cyan-100 text-cyan-800',
  PROPOSAL: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-slate-100 text-slate-800',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-slate-100 text-slate-600',
};

const VERIFICATION_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

interface Props {
  documentId: number;
  onClose: () => void;
  onRefresh: () => void;
}

export const DocumentDetailModal: React.FC<Props> = ({ documentId, onClose, onRefresh }) => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'restore' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canVerify = user?.permissions?.includes(Permissions.DOCUMENTS_VERIFY);
  const canDelete = user?.permissions?.includes(Permissions.DOCUMENTS_DELETE);
  const isImage = doc ? IMAGE_MIMES.includes(doc.mime_type) : false;
  const isArchived = doc?.status === 'ARCHIVED';

  const fetchDocument = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/documents/${documentId}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data.document);
      } else {
        showToast('Failed to load document details', 'error');
        onClose();
      }
    } catch {
      showToast('An error occurred', 'error');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  useEffect(() => {
    if (!doc || !isImage) return;
    let cancelled = false;
    const loadPreview = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/documents/${doc.id}/download`);
        if (res.ok && !cancelled) {
          const blob = await res.blob();
          setPreviewUrl(URL.createObjectURL(blob));
        }
      } catch {}
    };
    loadPreview();
    return () => { cancelled = true; if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [doc?.id, isImage]);

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/documents/${doc.id}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = doc.original_name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Download started.', 'success');
      } else {
        showToast('Download failed.', 'error');
      }
    } catch {
      showToast('Download failed.', 'error');
    }
  };

  const handleArchive = async () => {
    if (!doc) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/documents/${doc.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Archived from document detail' }),
      });
      if (res.ok) {
        showToast('Document archived.', 'success');
        setConfirmAction(null);
        fetchDocument();
        onRefresh();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to archive.', 'error');
      }
    } catch {
      showToast('An error occurred.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!doc) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/documents/${doc.id}/restore`, {
        method: 'PATCH',
      });
      if (res.ok) {
        showToast('Document restored.', 'success');
        setConfirmAction(null);
        fetchDocument();
        onRefresh();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to restore.', 'error');
      }
    } catch {
      showToast('An error occurred.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-xl rounded-2xl shadow-2xl relative flex flex-col max-h-full animate-scaleUp border border-slate-200 overflow-hidden">
        {/* Sticky Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-navy-600 shrink-0" />
            <span className="font-mono font-bold text-navy-900 text-xs bg-navy-50 px-2 py-0.5 rounded border border-navy-200 truncate">
              {doc?.document_code || '...'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : doc ? (
            <>
              {/* Preview */}
              {isImage && previewUrl && (
                <div className="bg-white rounded-xl border border-slate-200 p-2 overflow-hidden">
                  <img src={previewUrl} alt={doc.title} className="w-full max-h-64 object-contain rounded-lg" />
                </div>
              )}

              {/* Info Grid */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{doc.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.original_name}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${TYPE_COLORS[doc.document_type] || ''}`}>
                      {TYPE_LABELS[doc.document_type] || doc.document_type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold">Status</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[doc.status] || ''}`}>
                      {doc.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Verification</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${VERIFICATION_COLORS[doc.verification_status] || ''}`}>
                      {doc.verification_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">File Size</span>
                    <span className="ml-2 text-slate-800 font-semibold">{formatFileSize(doc.file_size)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">MIME Type</span>
                    <span className="ml-2 text-slate-800 font-semibold">{doc.mime_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Uploaded</span>
                    <span className="ml-2 text-slate-800 font-semibold">
                      {new Date(doc.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  {doc.verified_at && (
                    <div>
                      <span className="text-slate-500">Verified</span>
                      <span className="ml-2 text-slate-800 font-semibold">
                        {new Date(doc.verified_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                  {doc.deleted_at && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Archived</span>
                      <span className="ml-2 text-slate-800 font-semibold">
                        {new Date(doc.deleted_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {doc.verification_notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold">Verification Notes</span>
                    <p className="text-xs text-slate-700 mt-1">{doc.verification_notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-2">
                <button
                  onClick={handleDownload}
                  className="px-3 py-2 text-xs font-semibold text-white bg-navy-600 hover:bg-navy-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>

                {canVerify && !isArchived && doc.verification_status === 'PENDING' && (
                  <button
                    onClick={() => setShowVerifyModal(true)}
                    className="px-3 py-2 text-xs font-semibold text-white bg-navy-600 hover:bg-navy-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verify / Reject
                  </button>
                )}

                {canDelete && !isArchived && (
                  <button
                    onClick={() => setConfirmAction('archive')}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </button>
                )}

                {canDelete && isArchived && (
                  <button
                    onClick={() => setConfirmAction('restore')}
                    className="px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Verify Modal */}
        {showVerifyModal && doc && (
          <DocumentVerifyModal
            documentId={doc.id}
            documentCode={doc.document_code}
            onClose={() => setShowVerifyModal(false)}
            onSuccess={() => {
              setShowVerifyModal(false);
              fetchDocument();
              onRefresh();
            }}
          />
        )}

        {/* Confirmation Dialog */}
        {confirmAction && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                {confirmAction === 'archive' ? (
                  <Archive className="w-6 h-6 text-amber-500" />
                ) : (
                  <RotateCcw className="w-6 h-6 text-green-600" />
                )}
                <h3 className="font-bold text-slate-800">
                  {confirmAction === 'archive' ? 'Archive Document?' : 'Restore Document?'}
                </h3>
              </div>
              <p className="text-sm text-slate-600">
                {confirmAction === 'archive'
                  ? 'This document will be archived and hidden from the main list. You can restore it later.'
                  : 'This document will be restored to the active list.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction === 'archive' ? handleArchive : handleRestore}
                  disabled={actionLoading}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                    confirmAction === 'archive'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {actionLoading ? 'Processing...' : confirmAction === 'archive' ? 'Archive' : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
