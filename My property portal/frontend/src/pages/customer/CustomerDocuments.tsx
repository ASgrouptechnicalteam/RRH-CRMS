import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { FileText, Download, Upload, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

const CustomerDocuments = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; documentId?: string }>({
    open: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/customers/documents');
      setDocuments(res.data);
    } catch (error) {
      console.error('Error fetching documents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadModal.documentId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`/documents/${uploadModal.documentId}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadModal({ open: false });
      setFile(null);
      fetchDocuments();
    } catch (error) {
      alert('Upload failed. Please ensure it is a valid document under 10MB.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'Rejected':
        return <XCircle size={16} className="text-red-500" />;
      case 'Pending Verification':
        return <Clock size={16} className="text-amber-500" />;
      default:
        return <AlertCircle size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">My Documents</h2>
        <p className="text-slate-400 mt-2">Access your KYC, property agreements, and receipts.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No documents found.</p>
            <p className="text-sm mt-1">
              Your uploaded documents and property agreements will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Context</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-700/20 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {doc.documentType.replace(/_/g, ' ')}
                          </p>
                          <p
                            className="text-xs text-slate-400 truncate max-w-[200px]"
                            title={doc.originalFilename}
                          >
                            {doc.originalFilename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.context ? (
                        <div>
                          <p className="text-slate-200">{doc.context.project}</p>
                          <p className="text-xs text-slate-400">Unit: {doc.context.property}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">General Profile</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.verificationStatus)}
                        <span
                          className={`font-medium ${
                            doc.verificationStatus === 'Approved'
                              ? 'text-emerald-400'
                              : doc.verificationStatus === 'Rejected'
                                ? 'text-red-400'
                                : doc.verificationStatus === 'Pending Verification'
                                  ? 'text-amber-400'
                                  : 'text-slate-300'
                          }`}
                        >
                          {doc.verificationStatus}
                        </span>
                      </div>
                      {doc.verificationStatus === 'Rejected' && doc.remarks && (
                        <p className="text-xs text-red-400 mt-1 max-w-[200px] leading-tight">
                          Reason: {doc.remarks}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">v{doc.version}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                      >
                        <Download size={14} /> View
                      </a>
                      {['Rejected', 'Required'].includes(doc.verificationStatus) && (
                        <button
                          onClick={() => setUploadModal({ open: true, documentId: doc.id })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition"
                        >
                          <Upload size={14} /> Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleUpload}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-4">Upload Replacement</h3>
            <p className="text-slate-400 text-sm mb-6">
              Select a new file to upload as the latest version of this document.
            </p>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 mb-8"
              accept=".jpg,.jpeg,.png,.pdf"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUploadModal({ open: false })}
                className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || uploading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerDocuments;
