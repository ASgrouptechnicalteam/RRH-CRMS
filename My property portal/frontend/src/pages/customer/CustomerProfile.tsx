import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { User, Phone, Mail, MapPin, Calendar, Shield, Save } from 'lucide-react';

const CustomerProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/customers/profile');
        setProfile(res.data);
        setPhone(res.data.phone || '');
        setEmail(res.data.email || '');
        setAddress(res.data.address || '');
      } catch (error) {
        console.error('Error fetching profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await axios.put('/customers/profile', { phone, email, address });
      setProfile(res.data);
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-white">Profile not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">My Profile</h2>
        <p className="text-slate-400 mt-1">Manage your contact information and account details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Immutable Identity Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/20 mb-4">
              {profile.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-white">{profile.name}</h3>
            <p className="text-slate-400 text-sm mt-1 mb-4 flex items-center justify-center gap-1">
              <Shield size={14} className="text-emerald-400" /> Authorized Customer
            </p>
            <div className="inline-flex px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-xs font-mono text-slate-300">
              ID: {profile.id.split('-')[0]}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                Account Status
              </p>
              <div className="flex items-center gap-2 text-white">
                <span
                  className={`w-2 h-2 rounded-full ${profile.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                ></span>
                {profile.status}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                Joined Date
              </p>
              <div className="flex items-center gap-2 text-white">
                <Calendar size={16} className="text-slate-400" />
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Information Panel */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSave}
            className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-xl"
          >
            <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>

            {feedback && (
              <div
                className={`p-4 rounded-lg mb-6 text-sm ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
              >
                {feedback.message}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <User size={16} className="text-slate-400" /> Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Name changes require an official request workflow.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" /> Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-blue-500 rounded-lg p-3 text-white outline-none transition"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-blue-500 rounded-lg p-3 text-white outline-none transition"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" /> Residential Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-blue-500 rounded-lg p-3 text-white outline-none transition resize-none"
                  rows={3}
                  placeholder="Enter your full residential address"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition shadow-lg shadow-blue-500/20"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
