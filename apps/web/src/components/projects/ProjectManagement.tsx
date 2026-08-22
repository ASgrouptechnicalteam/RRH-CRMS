import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../config';
import { Roles, Permissions } from '@rrh-ems/shared';
import { ProjectFormWizard } from './ProjectFormWizard';
import { ProjectDossier } from './ProjectDossier';

export const ProjectManagement: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [viewingProjectId, setViewingProjectId] = useState<number | null>(null);

  const canCreate = user?.permissions?.includes(Permissions.PROJECTS_CREATE) || user?.roles?.includes(Roles.MD) || user?.roles?.includes(Roles.ADMIN);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/projects`);
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch (e) {
      showToast('Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'UNDER_CONSTRUCTION': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-teal-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Projects & Sites</h2>
          </div>
          <p className="text-xs text-teal-200/80">
            Manage real estate ventures, layouts, and their associated inventory units.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
         <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
           <span>Total Projects:</span>
           <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">{filteredProjects.length}</span>
         </div>
         
         <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
         </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
           {filteredProjects.map(proj => (
             <div key={proj.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-900 text-[10px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      PRJ-{proj.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(proj.status)}`}>
                      {proj.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1" title={proj.name}>
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {proj.location}
                    </p>
                  </div>
                  
                  <div className="pt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                   <div className="text-[10px] text-slate-500 font-medium">
                     <span className="block text-slate-400 mb-0.5">Assigned PM</span>
                     <span className="font-bold text-slate-700">
                       {proj.assigned_pm ? proj.assigned_pm.full_name : 'Unassigned'}
                     </span>
                   </div>
                   
                   <button
                     onClick={() => setViewingProjectId(proj.id)}
                     className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1"
                   >
                     <Eye className="w-3.5 h-3.5" /> Details
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <ProjectFormWizard 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchProjects();
          }}
        />
      )}
      
      {editingProject && (
        <ProjectFormWizard
          initialData={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null);
            fetchProjects();
            setViewingProjectId(editingProject.id); // Re-open dossier to show updated data
          }}
        />
      )}

      {viewingProjectId && !editingProject && (
        <ProjectDossier 
          projectId={viewingProjectId}
          onClose={() => setViewingProjectId(null)}
          onEdit={(proj) => {
            setViewingProjectId(null);
            setEditingProject(proj);
          }}
        />
      )}
    </div>
  );
};
