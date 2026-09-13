import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';

export const DEMContentManager = () => {
  const [type, setType] = useState('Carousel');
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetProject, setTargetProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [myContent, setMyContent] = useState<any[]>([]);

  const fetchMyContent = async () => {
    try {
      const res = await api.get('/system/content/employee');
      const all: any[] = [];
      Object.keys(res.data).forEach((key) => all.push(...res.data[key]));

      // Filter for Draft or Rejected to show in the DEM queue
      setMyContent(all.filter((c) => c.status === 'Draft' || c.status === 'Rejected'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyContent();
  }, []);

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    try {
      const payload: any = {
        type,
        title,
        description: messageText,
        message: messageText,
        priority: 1,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      };

      if (type !== 'Announcement') {
        payload.imageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa';
      }

      if (targetCompany) payload.targetCompanyId = targetCompany;
      if (targetProject) payload.targetProjectId = targetProject;

      const res = await api.post('/system/content/draft', payload);

      // Auto submit to workflow
      await api.post('/system/content/submit', { type, id: res.data.id });

      setStatusMsg(`Successfully drafted and submitted ${type} for verification!`);
      setTitle('');
      setMessageText('');
      setTargetCompany('');
      setTargetProject('');
      fetchMyContent();
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || 'Failed to draft content');
    } finally {
      setLoading(false);
    }
  };

  const submitDraft = async (id: string, cType: string) => {
    try {
      await api.post('/system/content/submit', { type: cType, id });
      fetchMyContent();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl space-y-8" id="dem-content-manager">
      <h2 className="text-3xl font-bold text-white">Content & Announcement Manager</h2>
      <p className="text-slate-400">
        Publish global announcements, project updates, and modify carousels here.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form
          onSubmit={handleDraft}
          className="bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Create New Content</h3>
          {statusMsg && (
            <div className="text-emerald-400 bg-emerald-500/10 p-4 rounded-lg text-sm">
              {statusMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Content Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
              >
                <option>Carousel</option>
                <option>Popup</option>
                <option>Offer</option>
                <option>Announcement</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Target Company ID (Optional)
              </label>
              <input
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="All Companies"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Target Project ID (Optional)
              </label>
              <input
                value={targetProject}
                onChange={(e) => setTargetProject(e.target.value)}
                placeholder="All Projects"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Content / Message</label>
            <textarea
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white h-32"
            ></textarea>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Draft & Submit to Pending Verification'}
          </button>
        </form>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">Action Required Queue</h3>
          <div className="space-y-4">
            {myContent.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-900 border border-slate-700 rounded-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {c._type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {c.status}
                  </span>
                </div>
                <h4 className="font-bold text-white text-lg">{c.title}</h4>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                  {c.description || c.message || c.content}
                </p>

                {c.status === 'Rejected' && c.rejectionReason && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-md">
                    <p className="text-xs font-bold text-rose-400">Rejection Reason:</p>
                    <p className="text-sm text-rose-300 mt-0.5">{c.rejectionReason}</p>
                  </div>
                )}

                {c.status === 'Draft' && (
                  <button
                    onClick={() => submitDraft(c.id, c._type)}
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Submit for Verification &rarr;
                  </button>
                )}
              </div>
            ))}
            {myContent.length === 0 && (
              <p className="text-slate-500 text-center py-8">
                No drafts or rejected content awaiting your action.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DEMDataIngestion = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      await api.post('/dem/ingest/customer', data);
      showToast('Customer registered successfully!');
      setActiveModal(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/dem/ingest/booking', {});
      showToast('Booking ingested successfully!');
      setActiveModal(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const handleEmiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mock API call for Phase 1
      setTimeout(() => {
        showToast('EMI Schedule created successfully!');
        setActiveModal(null);
        setLoading(false);
      }, 500);
    } catch (err: any) {
      alert('Error creating EMI Schedule');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6" id="dem-data-ingestion">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white text-sm px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
      <h2 className="text-2xl font-bold text-white">System Data Ingestion</h2>
      <p className="text-slate-400">
        Create records for new offline Customers, Properties, and initial Bookings.
      </p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-white">New Customer</h3>
            <p className="text-xs text-slate-500">
              Register a new offline customer and create their portal account.
            </p>
            <button
              onClick={() => setActiveModal('customer')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Customer
            </button>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-white">New Booking</h3>
            <p className="text-xs text-slate-500">
              Create a new property booking and assign it to an existing customer.
            </p>
            <button
              onClick={() => setActiveModal('booking')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Booking
            </button>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 bg-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-white">EMI Schedule</h3>
            <p className="text-xs text-slate-500">
              Generate an EMI schedule for an existing booking.
            </p>
            <button
              onClick={() => setActiveModal('emi')}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create EMI Schedule
            </button>
          </div>
        </div>
      </div>

      {activeModal === 'customer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Register New Customer</h3>
            <form onSubmit={handleCustomerSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  required
                  name="name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  required
                  name="phone"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Address</label>
                <input
                  name="address"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                >
                  {loading ? 'Saving...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'booking' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Create Booking</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Customer Phone
                </label>
                <input
                  required
                  name="phone"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Property ID / Plot Number
                </label>
                <input
                  required
                  name="propertyId"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium"
                >
                  {loading ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'emi' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Create EMI Schedule</h3>
            <form onSubmit={handleEmiSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Booking ID</label>
                <input
                  required
                  name="bookingId"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Total Months
                </label>
                <input
                  type="number"
                  required
                  name="months"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium"
                >
                  {loading ? 'Saving...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const DEMDashboard = () => {
  return (
    <div className="space-y-6" id="dem-dashboard">
      <h2 className="text-2xl font-bold text-white">DEM Dashboard</h2>
      <p className="text-slate-400">
        Summary of recent data entries and pending verification counts.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-2">Quick Actions</h3>
          <p className="text-sm text-slate-400">
            Use the sidebar to navigate to Payment Entry, Content Manager, or Data Ingestion
            workflows.
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-2">Recent Activity</h3>
          <p className="text-sm text-slate-500">
            Payments entered and documents uploaded by your account will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};
