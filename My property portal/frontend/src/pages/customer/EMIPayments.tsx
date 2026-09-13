import React, { useEffect, useState } from 'react';
import { AlertCircle, IndianRupee, FileText } from 'lucide-react';
import api from '../../lib/axios';

export const EMIPayments = () => {
  const [financials, setFinancials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const res = await api.get('/customers/financials');
        setFinancials(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, []);

  if (loading) return <div className="text-slate-500">Loading ledger...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Financial Ledger</h2>
        <p className="text-slate-500 mt-1">
          Track your EMI schedules and approved payment history across all properties.
        </p>
      </div>

      {/* Strict UX Reminder against online payments */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <h4 className="text-amber-900 font-semibold">Important Payment Information</h4>
          <p className="text-amber-800 text-sm mt-1">
            <strong>Payments cannot be made through this portal.</strong> This page serves strictly
            as a read-only ledger of your offline financial history. All payments must be made
            externally (via authorized Bank Transfer, UPI, or Cheque). Once completed, please notify
            your assigned representative to log the payment, which will reflect here upon
            verification.
          </p>
        </div>
      </div>

      {financials.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No EMI Schedules Found</h3>
          <p className="text-slate-500">
            You currently do not have any active EMI schedules tied to your properties.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {financials.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase">Schedule Overview</p>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">
                    Total Payable: ₹{schedule.totalScheduleExpected.toLocaleString()}
                  </h3>
                </div>
                <div className="flex gap-8">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500 uppercase">Approved Paid</p>
                    <p className="text-xl font-bold text-emerald-600">
                      ₹{schedule.totalScheduleCollected.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500 uppercase">Remaining</p>
                    <p className="text-xl font-bold text-slate-800">
                      ₹{schedule.totalRemaining.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-sm font-semibold text-slate-600">Due Date</th>
                      <th className="py-3 px-4 text-sm font-semibold text-slate-600">Expected</th>
                      <th className="py-3 px-4 text-sm font-semibold text-slate-600">
                        Approved Paid
                      </th>
                      <th className="py-3 px-4 text-sm font-semibold text-slate-600">Remaining</th>
                      <th className="py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedule.installments.map((inst: any) => {
                      const isOverdue =
                        new Date(inst.dueDate) < new Date() && inst.remainingAmount > 0;
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 text-sm font-medium text-slate-800">
                            {new Date(inst.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-slate-700">
                            ₹{inst.amountDue.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-emerald-600">
                            ₹{inst.collectedAmount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-slate-700">
                            ₹{inst.remainingAmount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            {inst.remainingAmount === 0 ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                Paid
                              </span>
                            ) : isOverdue ? (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                                Late
                              </span>
                            ) : inst.collectedAmount > 0 ? (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                Partial
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
