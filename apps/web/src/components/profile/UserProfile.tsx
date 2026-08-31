import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, MapPin, Building, Briefcase, Mail, Edit3, Camera, QrCode } from 'lucide-react';
import { PerformanceScoreWidget } from '../performance/PerformanceScoreWidget';
import { PerformanceHistoryTimeline } from '../performance/PerformanceHistoryTimeline';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { ProfileEditModal } from './ProfileEditModal';
import { QRCodeVisual } from '../common/QRCodeVisual';
import { API_BASE_URL, STATIC_URL } from '../../config';

export const UserProfile: React.FC = () => {
  const { user, fetchWithAuth, updateUser } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/attendance/my-qr`)
      .then((res) => res.json())
      .then((data) => setQrToken(data.signedToken || data.token))
      .catch(() => console.error('Failed to load QR code'));
  }, [fetchWithAuth]);

  if (!user) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/employees/me/photo`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateUser({ profileImageUrl: data.profile_image_url });
    } catch (err) {
      console.error('Failed to upload photo', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-navy-700 to-slate-800"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 gap-4 sm:gap-6 mb-6">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-navy-800 overflow-hidden">
                  {user.profileImageUrl ? (
                    <img src={`${STATIC_URL}${user.profileImageUrl}`} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12" />
                  )}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-2 right-2 p-2 bg-navy-600 text-white rounded-lg shadow-lg hover:bg-navy-700 transition-colors z-10 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </div>
            <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0">
              <h1 className="text-2xl font-bold text-slate-900">{user.fullName || 'Employee'}</h1>
              <p className="text-slate-500 font-medium">{user.roles?.join(', ')}</p>
            </div>
            <div className="shrink-0 flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-navy-600 text-white font-semibold rounded-xl hover:bg-navy-700 transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
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
                <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Employee ID</p>
                  <p className="font-mono font-bold text-slate-800">{user.employeeCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0">
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
                <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Phone / WhatsApp</p>
                  <p className="font-semibold text-slate-800 text-xs">
                    {user.phone || 'Not provided'}
                    {user.whatsappNumber && ` / ${user.whatsappNumber}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Email Address</p>
                  <p className="font-semibold text-slate-800 text-xs">{user.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 px-1">My Performance Metrics</h2>
          <PerformanceScoreWidget />
          <PerformanceHistoryTimeline />
        </div>

        {/* QR Code Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 px-1">Attendance QR</h2>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            {qrToken ? (
              <>
                <QRCodeVisual value={qrToken} size={180} label={user.employeeCode} />
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Scan this code at the Kiosk terminal to mark your daily attendance.
                </p>
              </>
            ) : (
              <div className="text-center text-slate-400">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">QR Code not available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <ProfileEditModal
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => setIsEditModalOpen(false)}
        />
      )}

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
