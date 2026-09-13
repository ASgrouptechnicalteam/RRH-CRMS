import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Building2, Bell, ArrowRight, IndianRupee, Tag, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [content, setContent] = useState<any>({ carousels: [], offers: [], announcements: [] });
  const [financials, setFinancials] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, contentRes, finRes, propRes] = await Promise.all([
          api.get('/customers/dashboard'),
          api.get('/system/content/active'),
          api.get('/customers/financials'),
          api.get('/customers/properties'),
        ]);
        setDashboardData(dashRes.data);
        setContent(contentRes.data);
        setFinancials(finRes.data);
        setProperties(propRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-slate-500">Loading your dashboard...</div>;

  // Calculate EMI Summary
  let totalRemaining = 0;
  let totalPaid = 0;
  financials.forEach((schedule) => {
    totalRemaining += schedule.totalRemaining || 0;
    totalPaid += schedule.totalScheduleCollected || 0;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* 2. CAROUSEL SECTION */}
      {content.carousels && content.carousels.length > 0 && (
        <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-lg bg-slate-900">
          <img
            src={content.carousels[0].imageUrl}
            alt="Carousel"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
            <h3 className="text-3xl font-bold text-white mb-2">{content.carousels[0].title}</h3>
            <p className="text-slate-200 max-w-2xl">{content.carousels[0].description}</p>
            {content.carousels[0].actionUrl && (
              <a
                href={content.carousels[0].actionUrl}
                target="_blank"
                className="mt-5 inline-flex px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg w-fit transition-colors"
              >
                Learn More
              </a>
            )}
          </div>
        </div>
      )}

      {/* 3. WELCOME / SUMMARY */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
        <p className="text-slate-500 mt-1">
          Here is a complete summary of your real estate portfolio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. PROPERTY SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Active Properties
              </p>
              <h3 className="text-3xl font-bold text-slate-800">
                {dashboardData?.activeProperties || 0}
              </h3>
            </div>
          </div>
          <Link
            to="/customer/properties"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 group"
          >
            View My Properties{' '}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 5. EMI SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div className="flex-1 flex justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Remaining Balance
                </p>
                <h3 className="text-3xl font-bold text-slate-800">
                  ₹{totalRemaining.toLocaleString()}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Total Paid
                </p>
                <p className="text-lg font-semibold text-emerald-600">
                  ₹{totalPaid.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <Link
            to="/customer/financials"
            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1 group"
          >
            View Financial Ledger{' '}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 6. OFFERS */}
      {content.offers && content.offers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" /> Exclusive Offers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.offers.map((offer: any) => (
              <div key={offer.id} className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <h4 className="font-bold text-indigo-900 mb-1">{offer.title}</h4>
                <p className="text-sm text-indigo-700">{offer.description}</p>
                <p className="text-xs text-indigo-500 mt-3 font-medium">
                  Terms and conditions apply.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {content.announcements && content.announcements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" /> System Announcements
          </h3>
          <div className="space-y-3">
            {content.announcements.map((announcement: any) => (
              <div
                key={announcement.id}
                className="bg-amber-50 border border-amber-100 rounded-xl p-5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-amber-900">{announcement.title}</h4>
                  <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-1 rounded">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{announcement.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 7. RECENT UPDATES */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Updates
            </h3>
            <Link to="/customer/properties" className="text-xs text-blue-600 hover:underline">
              View all properties
            </Link>
          </div>
          <div className="p-6 text-center text-slate-500 flex-1 flex items-center justify-center">
            {properties.length > 0 ? (
              <p className="text-sm">
                Click on a property from the My Properties page to view specific project updates,
                construction photos, and location alerts.
              </p>
            ) : (
              <p className="text-sm">You have no active properties to show updates for.</p>
            )}
          </div>
        </div>

        {/* 8. NOTIFICATIONS */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-400" /> Notifications
            </h3>
            <Link to="/customer/notifications" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {dashboardData?.notifications?.map((notif: any) => (
              <div key={notif.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <p className="font-medium text-slate-800">{notif.title}</p>
                <p className="text-sm text-slate-500 mt-1">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {!dashboardData?.notifications?.length && (
              <div className="px-6 py-12 text-center text-slate-500">
                You have no new notifications.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
