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
  const [assignedDemos, setAssignedDemos] = useState<number | string>('...');
  const [siteVisitsPending, setSiteVisitsPending] = useState<number | string>('...');
  const [activeProjects, setActiveProjects] = useState<number | string>('...');
  const [pendingResponses, setPendingResponses] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPMData = async () => {
    setIsLoading(true);
    try {
      const [propRes, visitRes, projRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/properties?status=PENDING_VERIFICATION`),
        fetchWithAuth(`${API_BASE_URL}/site-visits`),
        fetchWithAuth(`${API_BASE_URL}/projects`)
      ]);

      if (propRes.ok) {
        const propData = await propRes.json();
        setProperties(propData.properties || []);
      }

      if (visitRes.ok) {
        const visitData = await visitRes.json();
        const visits = visitData.visits || [];
        
        const myVisits = visits.filter((v: any) => v.project_manager_id === user?.id || v.assigned_agent_id === user?.id);
        
        setAssignedDemos(myVisits.filter((v: any) => v.status === 'SCHEDULED').length);
        
        const pending = myVisits.filter((v: any) => v.status === 'PENDING' || v.status === 'REQUESTED');
        setSiteVisitsPending(pending.length);
        
        setPendingResponses(pending.map((v: any) => ({
          id: String(v.id),
          title: v.lead?.customer_name || 'Visit Request',
          subtitle: `Scheduled for ${new Date(v.scheduled_date).toLocaleDateString()}`,
          icon: MapPin,
          meta: 'Review'
        })));
      } else {
        setAssignedDemos(0);
        setSiteVisitsPending(0);
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        const projects = projData.projects || [];
        setActiveProjects(projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'UNDER_CONSTRUCTION').length);
      } else {
        setActiveProjects(0);
      }
      
    } catch (e) {
      console.error('Fetch PM dashboard data error:', e);
      setAssignedDemos('—');
      setSiteVisitsPending('—');
      setActiveProjects('—');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPMData();
  }, []);

  // Compute KPIs
  const pendingPropertyAudits = properties.length;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
