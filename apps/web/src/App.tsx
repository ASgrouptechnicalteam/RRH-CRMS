import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginForm } from './components/auth/LoginForm';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { QRScannerModal } from './components/attendance/QRScannerModal';
import { DailyReportModal } from './components/reports/DailyReportModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ISTClock } from './components/common/ISTClock';
import { FirstLoginSetup } from './components/auth/FirstLoginSetup';
import { MDExecutiveDashboard } from './components/dashboards/MDExecutiveDashboard';
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
const HRDashboard = lazy(() => import('./components/hr/HRDashboard').then(m => ({ default: m.HRDashboard })));
const AnalyticsHub = lazy(() => import('./components/analytics/AnalyticsHub').then(m => ({ default: m.AnalyticsHub })));
const SystemControlHub = lazy(() => import('./components/system/SystemControlHub').then(m => ({ default: m.SystemControlHub })));
const FinanceHub = lazy(() => import('./components/finance/FinanceHub').then(m => ({ default: m.FinanceHub })));
const DocumentManagement = lazy(() => import('./components/documents/DocumentManagement').then(m => ({ default: m.DocumentManagement })));
// Legacy for standard users
const LateLeaveProposals = lazy(() => import('./components/attendance/LateLeaveProposals').then(m => ({ default: m.LateLeaveProposals })));

// Default Redirect based on role
const DefaultRedirect: React.FC<{ user: import('./context/AuthContext').UserProfile | null }> = ({ user }) => {
  const roles = user?.roles || [];
  
  if (roles.includes('Managing director')) return <Navigate to="/dashboard" replace />;
  if (roles.includes('Admin (Technical)')) return <Navigate to="/system-control" replace />;
  if (roles.includes('HR')) return <Navigate to="/hr-hub" replace />;
  if (roles.includes('accountant')) return <Navigate to="/finance" replace />;
  if (roles.some(r => ['telecallers', 'Digital lead operator', 'Digital Marketing head(manager)'].includes(r))) return <Navigate to="/leads" replace />;
  if (roles.some(r => ['project managers'].includes(r))) return <Navigate to="/properties" replace />;
  if (roles.some(r => ['Agent'].includes(r))) return <Navigate to="/site-visits" replace />;
  
  return <Navigate to="/tasks" replace />;
};

const MainLayout: React.FC = () => {
  const { user, accessToken, firstLoginDone, attendanceStamped, login, logout, fetchWithAuth } = useAuth();
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

  // Attendance & Report Exemption Logic
  const isExemptFromAttendance = user?.attendanceRequired === false || user?.roles?.some((r) => ['MD', 'Admin (Technical)', 'Marketing Director'].includes(r));
  const isExemptFromReport = user?.roles?.some((r) => ['MD', 'HR Manager', 'Admin (Technical)', 'Marketing Director'].includes(r));
  const needsAttendance = accessToken && !attendanceStamped && !isExemptFromAttendance;

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
        // Handle auto-logout. To avoid annoying the user if they were just visiting,
        // we can just directly logout. But if they haven't submitted a report,
        // we might lose their report. However, standard timeout behavior is direct logout.
        logout();
      }
    }
  });

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950">
        <LoginForm />
      </div>
    );
  }

  if (!firstLoginDone) {
    return <FirstLoginSetup />;
  }

  if (needsAttendance) {
    return <QRScannerModal />;
  }

  const isMD = user?.roles?.includes('Managing director');
  const isAdmin = user?.roles?.includes('Admin (Technical)');
  const canManageTargets = user?.roles?.some(r => ['Managing director', 'marketing director', 'Admin (Technical)'].includes(r));
  const canManageEmployees = user?.roles?.some(r => ['Managing director', 'HR', 'Admin (Technical)'].includes(r));
  const canViewTeamPerformance = user?.roles?.some(r =>
    ['Managing director', 'Admin (Technical)', 'marketing director', 'HR', 'project managers',
     'Digital Marketing head(manager)', 'accountant'].includes(r)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.svg" alt="RRH EMS Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-md shrink-0 object-contain" />
          <div>
            <h1 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">Radha Real Homes & Sonthillu</h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500">Employee Management System & CRM</p>
          </div>
        </div>

        {/* User Card, Notification Drawer & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ISTClock />
          <NotificationDrawer />

          <div 
            onClick={() => navigate('/profile')}
            className="text-right hidden sm:block border-l border-slate-200 pl-3 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
          >
            <div className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
              {user?.employeeCode}
            </div>
            <p className="text-[11px] text-slate-500">{user?.roles?.join(', ')}</p>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-xl transition-colors text-xs font-medium flex items-center gap-1 border border-slate-200"
            title="Daily Report"
          >
            <FileText className="w-4 h-4 text-teal-700" />
            <span className="hidden sm:inline">Daily Log</span>
          </button>

          <button
            onClick={handleLogoutClick}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

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

      {/* Primary Navigation Bar (Hidden on Mobile, replaced by BottomNav & Drawer) */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-4 sm:px-6 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
          <button
            onClick={() => navigate('/dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'dashboard' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/leads')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'leads' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Leads & Distribution</span>
          </button>

          {user?.permissions?.includes('LEADS_READ') && (
            <button
              onClick={() => navigate('/sales-pipeline')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'sales-pipeline' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-indigo-50'
              }`}
            >
              <LineChart className="w-4 h-4 text-indigo-400 group-hover:text-indigo-500" />
              <span>Sales Pipeline</span>
            </button>
          )}

          {user?.permissions?.includes('CUSTOMERS_READ') && (
            <button
              onClick={() => navigate('/customers')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'customers' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4 text-indigo-500" />
              <span>Customers</span>
            </button>
          )}

          {user?.roles?.some(r => ['Managing director', 'Admin (Technical)', 'marketing director', 'project managers'].includes(r)) && (
            <button
              onClick={() => navigate('/properties')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'properties' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Properties & Inventory</span>
            </button>
          )}

          {user?.permissions?.includes('PROJECTS_READ') && (
            <button
              onClick={() => navigate('/projects')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'projects' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Projects & Sites</span>
            </button>
          )}


          {user?.roles?.some(r => ['Managing director', 'Admin (Technical)', 'marketing director', 'telecallers', 'Agent', 'digital marketing executive'].includes(r)) && (
            <button
              onClick={() => navigate('/site-visits')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'site-visits' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Site Visits & Field Dispatch</span>
            </button>
          )}

          <button
            onClick={() => navigate('/tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'tasks' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task Manager</span>
          </button>

          {canManageEmployees && (
            <button
              onClick={() => navigate('/hr-hub')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'hr-hub' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>HR & Team Hub</span>
            </button>
          )}

          {/* Legacy Proposals for regular users */}
          {!canManageEmployees && (
            <button
              onClick={() => navigate('/proposals')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'proposals' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Proposals & Leaves</span>
            </button>
          )}

          {(canManageTargets || canViewTeamPerformance) && (
            <button
              onClick={() => navigate('/analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'analytics' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Analytics & Goals</span>
            </button>
          )}

          {(isMD || isAdmin) && (
            <button
              onClick={() => navigate('/system-control')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'system-control' ? 'bg-rose-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span className={activeTab === 'system-control' ? 'text-white font-bold' : 'text-rose-900 font-bold'}>System Control</span>
            </button>
          )}

          {user?.permissions?.includes('BOOKINGS_READ') && (
            <button
              onClick={() => navigate('/bookings')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'bookings' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Bookings</span>
            </button>
          )}

          {user?.permissions?.includes('documents.read') && (
            <button
              onClick={() => navigate('/documents')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'documents' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Documents</span>
            </button>
          )}

          {/* Finance — visible to all, Finance/MD get extra queue tab */}
          <button
            onClick={() => navigate('/finance')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'finance' ? 'bg-teal-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>Finance</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-20 md:pb-6">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="py-20 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading workstation module...</span>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<DefaultRedirect user={user} />} />
              <Route path="/dashboard" element={
                (isMD || isAdmin) ? (
                  <MDExecutiveDashboard />
                ) : user?.roles?.some((r) => ['Project Manager (Site)', 'Project Manager'].includes(r)) ? (
                  <PMDashboard />
                ) : user?.roles?.some((r) => ['Telecaller'].includes(r)) ? (
                  <TelecallerDashboard />
                ) : (
                  <StaffDashboard />
                )
              } />

              <Route path="/leads" element={<LeadManagement />} />
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
              <Route path="/hr-hub" element={
                canManageEmployees ? <HRDashboard /> : <Navigate to="/" replace />
              } />
              
              <Route path="/analytics" element={
                (canManageTargets || canViewTeamPerformance) ? <AnalyticsHub /> : <Navigate to="/" replace />
              } />

              <Route path="/system-control" element={
                (isMD || isAdmin) ? <SystemControlHub /> : <Navigate to="/" replace />
              } />

              {/* Finance Hub — all employees can submit, Finance/MD manage */}
              <Route path="/finance" element={<FinanceHub />} />

              {/* Legacy for regular staff */}
              <Route path="/proposals" element={<LateLeaveProposals />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Mobile Bottom Navigation Bar & PWA Prompt */}
      <MobileBottomNav />
      <PWAInstallPrompt />

      {/* Daily Report Modal (Logout Gate) */}
      <DailyReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setPendingLogout(false);
        }}
        onSuccess={() => {
          if (pendingLogout) logout();
        }}
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
                onClick={() => {
                  setShowLogoutIntentModal(false);
                  setPendingLogout(true);
                  setShowReportModal(true);
                }}
                className="w-full p-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors shadow-md"
              >
                Submit Daily Log & Logout
              </button>
              <button
                onClick={() => {
                  setShowLogoutIntentModal(false);
                  logout();
                }}
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
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

