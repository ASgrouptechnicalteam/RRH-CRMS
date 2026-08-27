import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Search, Plus, FileText, CheckCircle2, XCircle, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookingItem } from '../../types';

export const BookingManagement: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/bookings`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const searchStr = `${b.booking_code} ${b.customer?.first_name} ${b.customer?.last_name} ${b.property?.title}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">PENDING</span>;
      case 'CONFIRMED': return <span className="px-2 py-1 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">CONFIRMED</span>;
      case 'CANCELLED': return <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">CANCELLED</span>;
      case 'COMPLETED': return <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">COMPLETED</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Bookings & Reservations
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage unit reservations and payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            aria-label="Search bookings"
            placeholder="Search by Code, Customer, or Property..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No bookings found.</div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/bookings/${b.id}`)}
              className="p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-teal-800 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{b.booking_code}</span>
                  {getStatusBadge(b.status)}
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{b.customer?.first_name} {b.customer?.last_name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <IndianRupee className="w-3 h-3" />
                  Agreed: {b.agreed_price.toLocaleString()} • Bal: {b.balance_amount.toLocaleString()}
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">Property: {b.property?.title}</span>
                <span className="text-[10px] text-slate-400 mt-2">
                  Assigned: {b.assigned_employee?.full_name || 'N/A'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
