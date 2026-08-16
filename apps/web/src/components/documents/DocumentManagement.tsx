import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Upload, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Permissions, DocumentType, DocumentStatus, DocumentVerificationStatus } from '@rrh-ems/shared';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentDetailModal } from './DocumentDetailModal';

interface Document {
  id: number;
  document_code: string;
  document_type: string;
  title: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  status: string;
  verification_status: string;
  verified_at: string | null;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
  customer_id: number | null;
  lead_id: number | null;
  opportunity_id: number | null;
  booking_id: number | null;
  property_id: number | null;
  project_id: number | null;
  payment_id: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  BOOKING_AGREEMENT: 'bg-blue-100 text-blue-800',
  PAYMENT_RECEIPT: 'bg-green-100 text-green-800',
  BOOKING_RECEIPT: 'bg-emerald-100 text-emerald-800',
  SALE_DEED: 'bg-purple-100 text-purple-800',
  PROPERTY_TITLE: 'bg-indigo-100 text-indigo-800',
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

export const DocumentManagement: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVerification, setFilterVerification] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  const canCreate = user?.permissions?.includes(Permissions.DOCUMENTS_CREATE);

  const fetchDocuments = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (filterType) params.set('document_type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (filterVerification) params.set('verification_status', filterVerification);

      const res = await fetchWithAuth(`${API_BASE_URL}/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } else {
        showToast('Failed to load documents', 'error');
      }
    } catch {
      showToast('An error occurred while loading documents', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, filterType, filterStatus, filterVerification, showToast]);

  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.title.toLowerCase().includes(term) ||
      doc.document_code.toLowerCase().includes(term) ||
      doc.original_name.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: pagination.total,
  };

  if (!user?.permissions?.includes(Permissions.DOCUMENTS_READ)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500">
        <ShieldCheck className="w-16 h-16 text-rose-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
        <p className="text-sm mt-2 max-w-md text-center">You do not have the required permissions to view documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Document Management
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Upload, manage, and verify business documents
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center col-span-2 sm:col-span-4">
          <p className="text-xl font-black text-slate-800">{stats.total}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Documents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, code, or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Verification</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 sm:px-6 sm:py-4">Code</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Type</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Title</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">Verification</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold text-xs uppercase tracking-widest">Loading Documents...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold">No documents found.</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDocumentId(doc.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="font-mono font-bold text-teal-900 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {doc.document_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${TYPE_COLORS[doc.document_type] || 'bg-slate-100 text-slate-800'}`}>
                        {TYPE_LABELS[doc.document_type] || doc.document_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate block max-w-[200px]">{doc.title}</span>
                      <span className="text-[10px] text-slate-400 sm:hidden">{formatFileSize(doc.file_size)}</span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${STATUS_COLORS[doc.status] || ''}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${VERIFICATION_COLORS[doc.verification_status] || ''}`}>
                        {doc.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => fetchDocuments(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchDocuments(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDocuments(1);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedDocumentId && (
        <DocumentDetailModal
          documentId={selectedDocumentId}
          onClose={() => setSelectedDocumentId(null)}
          onRefresh={() => fetchDocuments(pagination.page)}
        />
      )}
    </div>
  );
};
