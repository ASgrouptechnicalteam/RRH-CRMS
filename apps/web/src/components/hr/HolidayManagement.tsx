import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../ui/DataTable';

export const HolidayManagement: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchHolidays = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/attendance/holidays`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch holidays');
      setHolidays(data.holidays || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name) return;
    setAdding(true);
    setError(null);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/attendance/holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, name, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add holiday');

      setHolidays(
        [...holidays, data.holiday].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      );
      setDate('');
      setName('');
      setNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/attendance/holidays/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      setHolidays(holidays.filter((h) => h.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 text-navy-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-navy-600" />
          Company Holidays
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Manage holidays. Employees cannot check in on these dates via Kiosk.
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Holiday Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diwali"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-navy-600 hover:bg-navy-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Holiday
            </button>
          </div>
        </form>

        <DataTable<any>
          columns={[
            {
              key: 'date',
              header: 'Date (IST)',
              render: (holiday) => (
                <span className="font-medium text-slate-700">
                  {new Date(holiday.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </span>
              ),
            },
            {
              key: 'name',
              header: 'Name',
              render: (holiday) => <span className="text-slate-600">{holiday.name}</span>,
            },
            {
              key: 'notes',
              header: 'Notes',
              render: (holiday) => (
                <span className="text-slate-500 text-sm">{holiday.notes || '-'}</span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (holiday) => (
                <button
                  onClick={() => handleDelete(holiday.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete Holiday"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ),
            },
          ]}
          data={holidays.filter((h) => h && h.date)}
          searchable={false}
          emptyMessage="No holidays configured yet."
        />
      </div>
    </div>
  );
};
