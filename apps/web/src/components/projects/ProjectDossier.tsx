import React, { useState, useEffect } from 'react';
import { Building2, X, MapPin, Calendar, Layout, Edit, CheckCircle2, ShieldCheck, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { Permissions } from '@rrh-ems/shared';
import { useToast } from '../../context/ToastContext';
import { PropertyManagement } from '../properties/PropertyManagement';

interface ProjectDossierProps {
  projectId: number;
  onClose: () => void;
  onEdit?: (project: any) => void;
}

export const ProjectDossier: React.FC<ProjectDossierProps> = ({ projectId, onClose, onEdit }) => {
  const { fetchWithAuth, user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);

  const canEdit = user?.permissions?.includes(Permissions.PROJECTS_UPDATE);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true);
      try {
        const [projRes, propRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/projects/${projectId}`),
          fetchWithAuth(`${API_BASE_URL}/properties?project_id=${projectId}`)
        ]);
        
        if (projRes.ok) {
          const pData = await projRes.json();
          setProject(pData.project);
        }
        
        if (propRes.ok) {
          const prData = await propRes.json();
          setProperties(prData.properties || []);
        }
      } catch (e) {
        showToast('Error loading project details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, fetchWithAuth]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center">
           <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold mt-4">Loading Project Details...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
      <div className="w-full h-full md:h-[90vh] max-w-6xl bg-slate-50 md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-scaleUp">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white flex items-start justify-between relative shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-teal-900/50 text-teal-300 border-teal-700`}>
                {project.status}
              </span>
              <span className="font-mono text-teal-200 text-xs px-2 py-0.5 bg-black/20 rounded">PRJ-{project.id}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{project.name}</h2>
            <p className="text-sm text-teal-100/80 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-teal-400" />
              {project.location}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && onEdit && (
              <button 
                onClick={() => onEdit(project)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Project
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Meta Data Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-1 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Key Information
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Assigned PM</span>
                  <span className="font-bold text-slate-700">
                    {project.assigned_pm ? `${project.assigned_pm.full_name} (${project.assigned_pm.employee_code})` : 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Total Area</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-slate-400" /> {project.total_area || 'Not Specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Launch Date</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" /> 
                    {project.launch_date ? new Date(project.launch_date).toLocaleDateString() : 'TBA'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Inventory Units</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-slate-400" /> {properties.length} Properties Linked
                  </span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
               <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                 Project Overview
               </h3>
               <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                 {project.description || 'No description provided.'}
               </p>
            </div>
          </div>

          {/* Properties Embedded Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
               <Building2 className="w-4 h-4 text-teal-600" /> Associated Inventory ({properties.length})
             </h3>
             
             {properties.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm">
                 No properties are currently linked to this project.
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {properties.map(prop => (
                   <div key={prop.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {prop.property_code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {prop.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{prop.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {prop.location}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                         <span className="font-semibold text-slate-700">₹ {(prop.price / 100000).toFixed(1)} L</span>
                         <span className="text-slate-500">{prop.area_sqft} sqft</span>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};
