import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Building2, MapPin, Loader2 } from 'lucide-react';

// Was an "Add Company"/"Add Project" form that originated catalog data
// directly in the portal's own database — removed (consolidation plan
// Decision 1). Companies/Projects/Properties now sync in from the CRM the
// moment a booking is confirmed there; creating a new one happens in the
// real CRM, same as any other property, not here.
export const MDProjects = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, projRes] = await Promise.all([
        api.get('/md/companies'),
        api.get('/md/projects'),
      ]);
      setCompanies(compRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies & Projects"
        subtitle="Synced from the CRM when a booking is confirmed there."
        breadcrumb={['Management', 'Projects']}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Companies"
          value={companies.length}
          icon={Building2}
          color="indigo"
        />
        <StatCard title="Total Projects" value={projects.length} icon={MapPin} color="blue" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Companies</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Company Name</th>
                    <th className="px-5 py-3">Address</th>
                    <th className="px-5 py-3">Projects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                        No companies synced yet
                      </td>
                    </tr>
                  )}
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-4 font-medium text-slate-900">{c.name}</td>
                      <td className="px-5 py-4 text-slate-500">{c.address || '—'}</td>
                      <td className="px-5 py-4 text-slate-600">{c._count?.projects || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Projects</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Project Name</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Properties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No projects synced yet
                      </td>
                    </tr>
                  )}
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-4 font-medium text-slate-900">{p.name}</td>
                      <td className="px-5 py-4 text-slate-500">{p.company?.name}</td>
                      <td className="px-5 py-4 text-slate-500">{p.location || '—'}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {p._count?.properties || 0} / {p.totalUnits || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
