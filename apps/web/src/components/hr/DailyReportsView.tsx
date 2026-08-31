import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Filter, Eye, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

export const DailyReportsView: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    fetchReports();
  }, [dateFilter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/reports/all?date=${dateFilter}`);
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to load daily reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-slate-50 relative flex flex-col p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-navy-50 text-navy-700 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Employee Daily Reports</h1>
            <p className="text-sm text-slate-500">View end-of-day submissions and target metrics.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Submitted At</th>
                <th className="px-6 py-4 font-semibold text-center">Calls</th>
                <th className="px-6 py-4 font-semibold text-center">Visits</th>
                <th className="px-6 py-4 font-semibold text-center">Deals</th>
                <th className="px-6 py-4 font-semibold text-center">Target Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No reports submitted for this date.
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{report.employee?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 font-mono">{report.employee?.employee_code}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(report.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{report.call_count}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{report.site_visit_count}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{report.closed_deal_count}</td>
                    <td className="px-6 py-4 text-center">
                      {report.target_met ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Below
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Report Details</h2>
                <p className="text-sm text-slate-500">
                  {selectedReport.employee?.full_name} • {new Date(selectedReport.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              
              {!selectedReport.target_met && selectedReport.below_target_reason && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Reason for Missing Target
                  </h3>
                  <p className="text-sm text-rose-700">{selectedReport.below_target_reason}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">End of Day Summary</h3>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap border border-slate-100">
                  {selectedReport.summary || 'No summary provided.'}
                </div>
              </div>

              {selectedReport.metrics_json && Object.keys(selectedReport.metrics_json).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Dynamic Metrics</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                    {Object.entries(selectedReport.metrics_json).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-xs text-slate-500 truncate" title={key}>{key}</div>
                        <div className="text-sm font-bold text-slate-800">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
