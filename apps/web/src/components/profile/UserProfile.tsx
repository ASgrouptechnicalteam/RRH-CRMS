import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, MapPin, Building, Briefcase, Mail } from 'lucide-react';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { PerformanceHistoryTimeline } from '../performance/PerformanceHistoryTimeline';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-teal-700 to-slate-800"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 gap-4 sm:gap-6 mb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100">
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-teal-800">
                <User className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0">
              <h1 className="text-2xl font-bold text-slate-900">{user.fullName || 'Employee'}</h1>
              <p className="text-slate-500 font-medium">{user.roles?.join(', ')}</p>
            </div>
            <div className="shrink-0 flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm border border-slate-200"
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employment Details */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Employment Details</h3>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Employee ID</p>
                  <p className="font-mono font-bold text-slate-800">{user.employeeCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Department & Branch</p>
                  <p className="font-semibold text-slate-800">{user.branch || 'Not Assigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Company</p>
                  <p className="font-semibold text-slate-800">{user.company || 'RRH'}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Info</h3>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Phone / WhatsApp</p>
                  <p className="font-semibold text-slate-800 text-xs">Contact HR to update</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Email Address</p>
                  <p className="font-semibold text-slate-800 text-xs">Contact HR to update</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 px-1">My Performance Metrics</h2>
        <PerformanceScoreWidget />
        <PerformanceHistoryTimeline />
      </div>

      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <ChangePasswordModal />
          </div>
        </div>
      )}
    </div>
  );
};
