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

// Lazy load Sales Manager Dashboard
const SalesManagerDashboard = lazy(() => import('./components/dashboards/SalesManagerDashboard').then(m => ({ default: m.SalesManagerDashboard })));

import { MobileBottomNav } from './components/common/MobileBottomNav';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { Bell } from 'lucide-react';

import { API_BASE_URL } from './config';
import { useIdleTimer } from './hooks/useIdleTimer';
import { usePushNotifications } from './hooks/usePushNotifications';
import { GlobalAnnouncementBanner } from './components/common/GlobalAnnouncementBanner';
import { Roles, Permissions } from '@rrh-ems/shared';
import { Kiosk } from './components/attendance/Kiosk';

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
const UserSettings = lazy(() => import('./components/settings/UserSettings').then(m => ({ default: m.UserSettings })));
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
  const isExemptFromReport = user?.roles?.some(
    (r) => r === Roles.MD || r === Roles.HR_MANAGER || r === Roles.ADMIN || r === Roles.MARKETING_DIRECTOR
  );


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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-navy-950">
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

  if (location.pathname === '/kiosk') {
    return (
      <ErrorBoundary>
        <Kiosk />
      </ErrorBoundary>
    );
  }

  const isMD = user?.roles?.includes(Roles.MD);
  const isTechAdmin = user?.roles?.includes(Roles.ADMIN);
  const isHRManager = user?.roles?.includes(Roles.HR_MANAGER);
  const isProjectManager = user?.roles?.includes(Roles.PROJECT_MANAGER);
  const isTelecaller = user?.roles?.includes(Roles.TELECALLER);
  const isSalesManager = user?.roles?.includes(Roles.SALES_MANAGER);
  const isStandardStaff = !isMD && !isTechAdmin && !isHRManager && !isProjectManager && !isTelecaller && !isSalesManager;

  // Role-based access for hubs
  const canManageTargets = user?.roles?.some(r => ([Roles.MD, Roles.MARKETING_DIRECTOR, Roles.ADMIN] as string[]).includes(r));
  const canManageEmployees = user?.roles?.some(r => ([Roles.MD, Roles.HR_MANAGER, Roles.ADMIN] as string[]).includes(r));
  const canViewTeamPerformance = user?.roles?.some(r =>
    ([Roles.MD, Roles.ADMIN, Roles.MARKETING_DIRECTOR, Roles.HR_MANAGER, Roles.PROJECT_MANAGER,
     Roles.DIGITAL_MARKETING_HEAD, Roles.FINANCE, Roles.SALES_MANAGER] as string[]).includes(r)
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
        ) : isSalesManager ? (
          <SalesManagerDashboard />
        ) : isTelecaller ? (
          <TelecallerDashboard />
        ) : (
          <StaffDashboard />
        )
      } />

      <Route path="/leads" element={<LeadManagement />} />
      <Route path="/leads-clients" element={<LeadManagement />} />
      <Route path="/sales-pipeline" element={user?.permissions?.includes(Permissions.LEADS_READ) ? <SalesPipelineManagement /> : <Navigate to="/" replace />} />
      <Route path="/customers" element={user?.permissions?.includes(Permissions.CUSTOMERS_READ) ? <CustomerManagement /> : <Navigate to="/" replace />} />
      <Route path="/projects" element={user?.permissions?.includes(Permissions.PROJECTS_READ) ? <ProjectManagement /> : <Navigate to="/" replace />} />
      <Route path="/properties" element={<PropertyManagement />} />
      <Route path="/site-visits" element={<SiteVisitManagement />} />
      <Route path="/tasks" element={<TaskManager />} />
      <Route path="/bookings" element={user?.permissions?.includes(Permissions.BOOKINGS_READ) ? <BookingManagement /> : <Navigate to="/" replace />} />
      <Route path="/bookings/:id" element={user?.permissions?.includes(Permissions.BOOKINGS_READ) ? <BookingDossier /> : <Navigate to="/" replace />} />
      <Route path="/documents" element={user?.permissions?.includes(Permissions.DOCUMENTS_READ) ? <DocumentManagement /> : <Navigate to="/" replace />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/settings" element={<UserSettings />} />
      
      {/* Consolidated Hubs */}
      <Route path="/hr-hub" element={canManageEmployees ? <HRDashboard /> : <Navigate to="/" replace />} />
      
      <Route path="/analytics" element={
        (canManageTargets || canViewTeamPerformance) ? <AnalyticsHub /> : <Navigate to="/" replace />
      } />

      <Route path="/system-control" element={(isMD || isTechAdmin) ? <SystemControlHub /> : <Navigate to="/" replace />} />

      <Route path="/finance" element={
        (isMD || isTechAdmin || user?.roles?.includes(Roles.FINANCE))
          ? <FinanceHub />
          : <Navigate to="/" replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Page context for the header — one clear business title per route.
  const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/leads': 'Leads',
    '/leads-clients': 'Leads',
    '/sales-pipeline': 'Sales Pipeline',
    '/customers': 'Customers',
    '/properties': 'Properties',
    '/projects': 'Projects',
    '/site-visits': 'Site Visits',
    '/tasks': 'Tasks',
    '/bookings': 'Bookings',
    '/documents': 'Documents',
    '/profile': 'Profile',
    '/settings': 'Personal Settings',
    '/hr-hub': 'Employees & Attendance',
    '/analytics': 'Analytics & Goals',
    '/system-control': 'System Control',
    '/finance': 'Payments & Refunds',
  };
  const pageTitle = PAGE_TITLES[location.pathname] || 'RRH-CRMS';

  return (
    <AppLayout title={pageTitle}>
      {/* Global Image Banner */}
      <GlobalAnnouncementBanner />

      {/* Push Notification Banner */}
      {isSupported && permission === 'default' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm z-30 relative">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600 animate-bounce" />
            <span className="text-sm font-semibold text-amber-900">
              Enable push notifications to receive real-time updates and leads.
            </span>
          </div>
          <button
            onClick={subscribe}
            disabled={isSubscribing}
            className="w-full sm:w-auto bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-amber-700 transition-colors disabled:opacity-70 whitespace-nowrap"
          >
            {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      )}

      {/* Main Content Body — Routes rendered inside AppLayout content canvas */}
      <div className="main-content p-4 sm:p-6 max-w-7xl w-full mx-auto pb-20 md:pb-6">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="py-20 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 border-3 border-navy-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading workstation module...</span>
              </div>
            }
          >
            {dashboardElement}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Mobile Bottom Navigation Bar & PWA Prompt */}
      <MobileBottomNav />
      <PWAInstallPrompt />

      {/* Daily Report Modal (Logout Gate) */}
      <DailyReportModal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setPendingLogout(false); }}
        onSuccess={() => { if (pendingLogout) logout(); }}
      />

      {/* Logout Intent Modal */}
      {showLogoutIntentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative animate-scaleUp">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Logout Action</h3>
            <p className="text-sm text-slate-600 mb-6">
              You haven't submitted your Daily Log. Were you working a full shift, or just visiting/updating?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => { setShowLogoutIntentModal(false); setPendingLogout(true); setShowReportModal(true); }}
                className="w-full p-3 bg-navy-700 text-white font-bold rounded-xl hover:bg-navy-800 transition-colors shadow-md"
              >
                Submit Daily Log & Logout
              </button>
              <button
                onClick={() => { setShowLogoutIntentModal(false); logout(); }}
                className="w-full p-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Just Visiting / Updating (Log out immediately)
              </button>
              <button
                onClick={() => setShowLogoutIntentModal(false)}
                className="w-full p-2 text-slate-500 font-bold hover:text-slate-700 text-xs"
              >
                Cancel Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
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
