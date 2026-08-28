import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  CalendarCheck,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { PropertyListItem } from '../../types';
import { PropertyManagement } from '../properties/PropertyManagement';
import { StatCard, ListWidget, ListItem } from '../ui';

import { ActiveSiteVisitsBanner } from '../siteVisits/ActiveSiteVisitsBanner';

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

  // Compute KPIs
  const pendingPropertyAudits = properties.length;
  // Placeholders since data is not fetched in this layer yet
  const assignedDemos = 0;
  const siteVisitsPending = 0;
  const activeProjects = 0;

  // Placeholder for Distinctive Widget
  const pendingResponses: ListItem[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Project Manager Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.employeeCode}. Here are your pending actions and audits.</p>
        </div>
      </div>

      <ActiveSiteVisitsBanner />

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Assigned Demos" 
          value={assignedDemos} 
          icon={CalendarCheck} 
        />
        <StatCard 
          label="Visits Pending Acceptance" 
          value={siteVisitsPending} 
          icon={MapPin} 
        />
        <StatCard 
          label="Active Projects" 
          value={activeProjects} 
          icon={Building} 
        />
        <StatCard 
          label="Pending Property Audits" 
          value={pendingPropertyAudits} 
          icon={ClipboardList} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Property Verification Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          <PropertyManagement />
        </div>

        {/* Right Column: Distinctive Widget */}
        <div className="space-y-6">
          <ListWidget 
            title="Pending My Response"
            items={pendingResponses}
            emptyStateMessage="No visit requests pending acceptance."
          />
        </div>
      </div>
    </div>
  );
};
