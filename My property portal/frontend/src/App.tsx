import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { PolicyAcceptance } from './pages/PolicyAcceptance';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MDLayout } from './layouts/MDLayout';
import { MDDashboard } from './pages/md/MDDashboard';
import { EmployeeManagement } from './pages/md/EmployeeManagement';
import { Customer360 } from './pages/md/Customer360';
import { MDProjects } from './pages/md/MDProjects';
import { MDProperties } from './pages/md/MDProperties';
import { DEMLayout } from './layouts/DEMLayout';
import { DEMDashboard, DEMContentManager, DEMDataIngestion } from './pages/dem/DEMContentManager';
import { DEMPaymentEntry } from './pages/dem/DEMPaymentEntry';
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { MyProperties } from './pages/customer/MyProperties';
import { EMIPayments } from './pages/customer/EMIPayments';
import { PropertyDetails } from './pages/customer/PropertyDetails';
import { NotificationCenter } from './pages/customer/NotificationCenter';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerDocuments from './pages/customer/CustomerDocuments';
import { ContentApproval } from './pages/md/ContentApproval';
import { ReportsDashboard } from './pages/md/ReportsDashboard';
import { AuditLogViewer } from './pages/md/AuditLogViewer';
import { FMManagement } from './pages/md/FMManagement';
import { DEMManagement } from './pages/md/DEMManagement';
import { GlobalPopupManager } from './components/GlobalPopupManager';
import FMLayout from './layouts/FMLayout';
import PMLayout from './layouts/PMLayout';
import PMDashboard from './pages/pm/PMDashboard';
import PMProjectDetails from './pages/pm/PMProjectDetails';
import FMDashboard from './pages/fm/FMDashboard';
import FMPropertyUpdates from './pages/fm/FMPropertyUpdates';
import PaymentVerificationQueue from './pages/shared/PaymentVerificationQueue';

function App() {
  return (
    <AuthProvider>
      <GlobalPopupManager />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Customer']} />}>
            <Route path="/customer/policy" element={<PolicyAcceptance />} />
            <Route element={<CustomerLayout />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/properties" element={<MyProperties />} />
              <Route path="/customer/properties/:id" element={<PropertyDetails />} />
              <Route path="/customer/financials" element={<EMIPayments />} />
              <Route path="/customer/documents" element={<CustomerDocuments />} />
              <Route path="/customer/notifications" element={<NotificationCenter />} />
              <Route path="/customer/profile" element={<CustomerProfile />} />
            </Route>
          </Route>

          {/* MD Routes */}
          <Route element={<ProtectedRoute allowedRoles={['MD']} />}>
            <Route element={<MDLayout />}>
              <Route path="/md/dashboard" element={<MDDashboard />} />
              <Route path="/md/projects" element={<MDProjects />} />
              <Route path="/md/properties" element={<MDProperties />} />
              <Route path="/md/customers" element={<Customer360 />} />
              <Route path="/md/employees" element={<EmployeeManagement />} />
              <Route path="/md/content-approval" element={<ContentApproval />} />
              <Route path="/md/reports" element={<ReportsDashboard />} />
              <Route path="/md/audit-logs" element={<AuditLogViewer />} />
              <Route path="/md/fm" element={<FMManagement />} />
              <Route path="/md/dem" element={<DEMManagement />} />
              <Route path="/md/payments" element={<PaymentVerificationQueue />} />
              <Route path="/md/notifications" element={<NotificationCenter />} />
            </Route>
          </Route>

          {/* PM Routes */}
          <Route element={<ProtectedRoute allowedRoles={['PM']} />}>
            <Route element={<PMLayout />}>
              <Route path="/pm/dashboard" element={<PMDashboard />} />
              <Route path="/pm/projects" element={<PMProjectDetails />} />
              <Route path="/pm/payments" element={<PaymentVerificationQueue />} />
              <Route path="/pm/reports" element={<ReportsDashboard />} />
            </Route>
          </Route>

          {/* FM Routes */}
          <Route element={<ProtectedRoute allowedRoles={['FM']} />}>
            <Route element={<FMLayout />}>
              <Route path="/fm/dashboard" element={<FMDashboard />} />
              <Route path="/fm/property-updates" element={<FMPropertyUpdates />} />
              <Route path="/fm/payments" element={<PaymentVerificationQueue />} />
              <Route path="/fm/project-info" element={<PMProjectDetails />} />
            </Route>
          </Route>

          {/* DEM Routes */}
          <Route element={<ProtectedRoute allowedRoles={['DEM', 'MD']} />}>
            <Route element={<DEMLayout />}>
              <Route path="/dem/dashboard" element={<DEMDashboard />} />
              <Route path="/dem/payments" element={<DEMPaymentEntry />} />
              <Route path="/dem/data" element={<DEMDataIngestion />} />
              <Route path="/dem/content" element={<DEMContentManager />} />
              <Route path="/dem/documents" element={<CustomerDocuments />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route
            path="/unauthorized"
            element={
              <div className="p-8 text-white text-center">
                <h1>403 - Unauthorized</h1>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="p-8 text-white text-center">
                <h1>404 - Not Found</h1>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
