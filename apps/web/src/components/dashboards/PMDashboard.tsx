import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Camera,
  AlertCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { PropertyListItem } from '../../types';
import { PropertyManagement } from '../properties/PropertyManagement';

export const PMDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPMProperties = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/properties?status=PENDING_VERIFICATION`);
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
      }
    } catch (e) {
      console.error('Fetch PM properties error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPMProperties();
  }, []);

  return (
    <div className="space-y-6">
      {/* PM Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-navy-950 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-amber-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Project Manager On-Site Verification Queue</h2>
          </div>
          <p className="text-xs text-amber-200/80">
            Stage 1 Inspection Workstation: Verify site boundaries, location coordinates, amenities, and on-site photos.
          </p>
        </div>

        <div 
          onClick={() => navigate('/properties')}
          className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 text-center cursor-pointer hover:bg-white/20 transition-colors"
        >
          <span className="text-[10px] uppercase font-bold text-amber-300 block">Pending On-Site Audits</span>
          <span className="text-lg font-black text-white">{properties.length} Properties</span>
        </div>
      </div>

      {/* Property Pipeline Workspace */}
      <PropertyManagement />
    </div>
  );
};
