import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/common/AppLayout';
import { LoginForm } from './components/auth/LoginForm';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { DailyReportModal } from './components/reports/DailyReportModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ISTClock } from './components/common/ISTClock';
import { FirstLoginSetup } from './components/auth/FirstLoginSetup';
import { MDExecutiveDashboard } from './components/dashboards/MDExecutiveDashboard';
import { AdminCommandCenter } from './components/dashboards/AdminCommandCenter';
import { TelecallerDashboard } from './components/dashboards/TelecallerDashboard';
import { PMDashboard } from './components/dashboards/PMDashboard';
import { StaffDashboard } from './components/dashboards/StaffDashboard';

import { MobileBottomNav } from './components/common/MobileBottomNav';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { LogOut, CheckCircle2, Clock, FileText, CheckSquare, Target, Users, TrendingUp, Building, MapPin, ShieldCheck, IndianRupee, Bell, LineChart } from 'lucide-react';
import { API_BASE_URL } from './config';
import { useIdleTimer } from './hooks/useIdleTimer';
import { usePushNotifications } from './hooks/usePushNotifications';
import { GlobalAnnouncementBanner } from './components/common/GlobalAnnouncementBanner';
// Lazy-loaded heavy tab modules for optimal initial load performance & code splitting
const LeadManagement = lazy(() => import('./components/leads/LeadManagement').then(m => ({ default: m.LeadManagement })));
const SalesPipelineManagement = lazy(() => import('./components/sales/SalesPipelineManagement').then(m => ({ default: m.SalesPipelineManagement })));
const CustomerManagement = lazy(() => import('./components/customers/CustomerManagement').then(m => ({ default: m.CustomerManagement })));
const PropertyManagement = lazy(() => import('./components/properties/PropertyManagement').then(m => ({ default: m.PropertyManagement })));
const ProjectManagement = lazy(() => import('./components/projects/ProjectManagement').then(m => ({ default: m.ProjectManagement })));
const SiteVisitManagement = lazy(() => import('./components/siteVisits/SiteVisitManagement').then(m => ({ default: m.SiteVisitManagement })));
const TaskManager = lazy(() => import('./components/tasks/TaskManager').then(m => ({ default: m.TaskManager })));
const BookingManagement = lazy(() => import('./components/commercial/BookingManagement').then(m => ({ default: m.BookingManagement })));
const BookingDossier = lazy(() => import('./components/commercial/BookingDossier').then(m => ({ default: m.BookingDossier })));

// Expose a prefetch function for background loading
export const prefetchMainModules = () => {
  setTimeout(() => {
    import('./components/leads/LeadManagement');
    import('./components/sales/SalesPipelineManagement');
    import('./components/customers/CustomerManagement');
    import('./components/properties/PropertyManagement');
    import('./components/projects/ProjectManagement');
    import('./components/siteVisits/SiteVisitManagement');
    import('./components/tasks/TaskManager');
    import('./components/commercial/BookingManagement');
  }, 2000); // 2-second delay to prioritize initial render
};

// New Consolidated Hubs
const UserProfile = lazy(() => import('./components/profile/UserProfile').then(m => ({ default: m.UserProfile })));
const HRDashboard = lazy(() => import('./components/hr/HRDashboard').then(m => ({
  default: m.HRDashboard
})));
const AnalyticsHub = lazy(() => import('./components/analytics/AnalyticsHub').then(m => ({ default: m.AnalyticsHub })));
const SystemControlHub = lazy(() => import('./components/system/SystemControlHub').then(m => ({ default: m.SystemControlHub })));
const FinanceHub = lazy(() => import('./components/finance/FinanceHub').then(m => ({ default: m.FinanceHub })));
const DocumentManagement = lazy(() => import('./components/documents/DocumentManagement').then(m => ({ default: m.DocumentManagement })));
// Legacy for standard users
const LateLeaveProposals = lazy(() => import('./components/attendance/LateLeaveProposals').then(m => ({ default: m.LateLeaveProposals })));

// TopUtilityBar placeholder — title rendered in AppLayout header
const TopUtilityBar: React.FC<{ title?: string }> = ({ title }) => {
  return null;
};

const DefaultRedirect: React.FC<{ user: unknown }> = () => (
  <Navigate to="/dashboard" replace />
);

// AppShell provides the global layout shell: compact left sidebar, top utility bar,
// responsive 12-column content grid, and optional right rail. The Routes and
// internal modal logic are rendered as children inside the AppLayout content canvas.
const AppShell: React.FC = () => {
  const { user, accessToken, authStatus, firstLoginDone, attendanceStamped, login, logout, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.replace('/', '') || 'dashboard';
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingLogout, setPendingLogout] = useState(false);
  const { isSupported, permission, isSubscribing, subscribe } = usePushNotifications();

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus('Offline'));
      
    // Prefetch main modules for better performance
    if (accessToken) {
      prefetchMainModules();
    }
    // Auto-prompt push notifications on login if not already decided
    if (accessToken && isSupported && permission === 'default') {
      const timer = setTimeout(() => {
        subscribe();
      }, 2000); // Wait 2s after login so it's not immediately jarring
      return () => clearTimeout(timer);
    }
  }, [accessToken, isSupported, permission, subscribe]);

  // Report Exemption Logic (for logout gate only — attendance gating removed)
  const isExemptFromReport = user?.roles?.some((r) => ['MD', 'HR Manager', 'Admin (Technical)', 'Marketing Director'].includes(r));

  const [showLogoutIntentModal, setShowLogoutIntentModal] = useState(false);

  const handleLogoutClick = async () => {
    if (isExemptFromReport) {
      logout();
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/reports/today-status`);
      const data = await res.json();
      if (res.ok && data.report) {
        logout();
      } else {
        setShowLogoutIntentModal(true);
      }
    } catch (e) {
      setShowLogoutIntentModal(true);
    }
  };

  // 30 minutes idle timer (30 * 60 * 1000 ms)
  useIdleTimer({
    timeout: 30 * 60 * 1000,
    onIdle: () => {
      if (accessToken) {
        console.log('User inactive for 30 minutes, logging out automatically');
        logout();
      }
    }
  });

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950">
        <LoginForm />
      </div>
    );
  }

  if (authStatus === 'bootstrapping') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8">
        <div className="text-navy text-xl font-semibold mb-4">RRH-CRMS</div>
        <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-neutral-600">Loading application...</span>
      </div>
    );
  }

  if (!firstLoginDone) {
    return <FirstLoginSetup />;
  }

  const isMD = user?.roles?.includes('Managing director');
  const isTechAdmin = user?.roles?.includes('Admin (Technical)');
  const isHRManager = user?.roles?.includes('HR Manager');
  const isProjectManager = user?.roles?.some((r) => ['Project Manager (Site)', 'Project Manager'].includes(r));
  const isTelecaller = user?.roles?.some((r) => ['Telecaller'].includes(r));
  const isStandardStaff = !isMD && !isTechAdmin && !isHRManager && !isProjectManager && !isTelecaller;

  // Role-based access for hubs
  const canManageTargets = user?.roles?.some(r => ['Managing director', 'marketing director', 'Admin (Technical)'].includes(r));
  const canManageEmployees = user?.roles?.some(r => ['Managing director', 'HR', 'Admin (Technical)'].includes(r));
  const canViewTeamPerformance = user?.roles?.some(r =>
    ['Managing director', 'Admin (Technical)', 'marketing director', 'HR', 'project managers',
     'Digital Marketing head(manager)', 'accountant'].includes(r)
  );

  // Role-to-dashboard resolver — each role gets its own dedicated dashboard
  const dashboardElement = (
    <Routes>
      <Route path="/" element={<DefaultRedirect user={user} />} />
      <Route path="/dashboard" element={
        isMD ? (
          <MDExecutiveDashboard />
        ) : isTechAdmin ? (
          <AdminCommandCenter />
        ) : isHRManager ? (
          <HRDashboard />
        ) : isProjectManager ? (
          <PMDashboard />
        ) : isTelecaller ? (
          <TelecallerDashboard />
        ) : (
          <StaffDashboard />
        )
      } />

      <Route path="/leads" element={<LeadManagement />} />
      <Route path="/leads-clients" element={<LeadManagement />} />
      <Route path="/sales-pipeline" element={user?.permissions?.includes('LEADS_READ') ? <SalesPipelineManagement /> : <Navigate to="/" replace />} />
      <Route path="/customers" element={user?.permissions?.includes('CUSTOMERS_READ') ? <CustomerManagement /> : <Navigate to="/" replace />} />
      <Route path="/projects" element={user?.permissions?.includes('PROJECTS_READ') ? <ProjectManagement /> : <Navigate to="/" replace />} />
      <Route path="/properties" element={<PropertyManagement />} />
      <Route path="/site-visits" element={<SiteVisitManagement />} />
      <Route path="/tasks" element={<TaskManager />} />
      <Route path="/bookings" element={user?.permissions?.includes('BOOKINGS_READ') ? <BookingManagement /> : <Navigate to="/" replace />} />
      <Route path="/bookings/:id" element={user?.permissions?.includes('BOOKINGS_READ') ? <BookingDossier /> : <Navigate to="/" replace />} />
      <Route path="/documents" element={user?.permissions?.includes('documents.read') ? <DocumentManagement /> : <Navigate to="/" replace />} />
      <Route path="/profile" element={<UserProfile />} />
      
      {/* Consolidated Hubs */}
      <Route path="/hr-hub" element={canManageEmployees ? <HRDashboard /> : <Navigate to="/" replace />} />
      
      <Route path="/analytics" element={
        (canManageTargets || canViewTeamPerformance) ? <AnalyticsHub /> : <Navigate to="/" replace />
      } />

      <Route path="/system-control" element={isMD ? <SystemControlHub /> : <Navigate to="/" replace />} />

      <Route path="/finance" element={<FinanceHub />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;