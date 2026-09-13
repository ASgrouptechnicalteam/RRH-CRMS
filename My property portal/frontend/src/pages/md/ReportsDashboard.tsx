import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { downloadCSV } from '../../utils/export';
import { Download, Printer, BarChart3, Users, Building2 } from 'lucide-react';

export const ReportsDashboard = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportType, setReportType] = useState('companies');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${reportType}`);
      // Normalize array data if it's an object (like revenue)
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    downloadCSV(reportData, `${reportType}_report_${new Date().getTime()}`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl space-y-8 text-white">
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
          <p className="text-slate-400">View and export real-time business intelligence.</p>
        </div>

        <div className="flex gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="companies">Company Comparison</option>
            <option value="revenue">Revenue & Collections</option>
            <option value="projects">Project Analytics</option>
            <option value="customers">Customer Analytics</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> CSV / Excel
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Generating report...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden print:bg-white print:text-black">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 print:bg-gray-100">
                  {Object.keys(reportData[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="p-4 font-semibold text-slate-300 print:text-black uppercase text-xs tracking-wider border-b border-slate-700 print:border-gray-300"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 print:divide-gray-200">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="p-4 text-sm text-slate-300 print:text-gray-800">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No data available for this report.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
