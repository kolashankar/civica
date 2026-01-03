import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import HeadmasterSidebar from './components/layout/HeadmasterSidebar';
import OfficeSidebar from './components/layout/OfficeSidebar';
import ResponderSidebar from './components/layout/ResponderSidebar';
import LoginPage from './pages/Login';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import Schools from './pages/admin/Schools';
import Offices from './pages/admin/Offices';
import Users from './pages/admin/Users';
import Teams from './pages/admin/Teams';
import Templates from './pages/admin/Templates';
import Inspections from './pages/admin/Inspections';
import Analytics from './pages/admin/Analytics';
import Notifications from './pages/admin/Notifications';

// Headmaster pages
import HeadmasterDashboard from './pages/headmaster/Dashboard';
import Students from './pages/headmaster/Students';
import StudentForm from './pages/headmaster/StudentForm';
import HeadmasterTeams from './pages/headmaster/Teams';
import TeamForm from './pages/headmaster/TeamForm';
import TeamDetail from './pages/headmaster/TeamDetail';
import HeadmasterInspections from './pages/headmaster/Inspections';
import InspectionDetail from './pages/headmaster/InspectionDetail';
import HeadmasterAnalytics from './pages/headmaster/Analytics';
import HeadmasterNotifications from './pages/headmaster/Notifications';
import HeadmasterProfile from './pages/headmaster/Profile';
import HeadmasterSettings from './pages/headmaster/Settings';

// Office pages
import OfficeDashboard from './pages/office/Dashboard';
import OfficeInspections from './pages/office/Inspections';
import OfficeInspectionDetail from './pages/office/InspectionDetail';
import ResponseForm from './pages/office/ResponseForm';
import OfficeHistory from './pages/office/History';
import OfficeAnalytics from './pages/office/Analytics';
import OfficeNotifications from './pages/office/Notifications';
import OfficeProfile from './pages/office/Profile';
import OfficeSettings from './pages/office/Settings';

// Responder pages
import ResponderDashboard from './pages/responder/Dashboard';
import ResponderInspections from './pages/responder/Inspections';
import ResponderInspectionDetail from './pages/responder/InspectionDetail';
import ResponderEscalations from './pages/responder/Escalations';
import ResponderEscalationDetail from './pages/responder/EscalationDetail';
import ResponderCompliance from './pages/responder/Compliance';
import ResponderComplianceDetail from './pages/responder/ComplianceDetail';
import ResponderAnalytics from './pages/responder/Analytics';
import ResponderReports from './pages/responder/Reports';
import ResponderViolations from './pages/responder/Violations';
import ResponderNotifications from './pages/responder/Notifications';
import ResponderProfile from './pages/responder/Profile';
import ResponderSettings from './pages/responder/Settings';

const App: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-100">
              <Sidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="schools" element={<Schools />} />
                  <Route path="offices" element={<Offices />} />
                  <Route path="users" element={<Users />} />
                  <Route path="teams" element={<Teams />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="inspections" element={<Inspections />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      
      {/* Headmaster Routes */}
      <Route
        path="/headmaster/*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-100">
              <HeadmasterSidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Routes>
                  <Route path="dashboard" element={<HeadmasterDashboard />} />
                  <Route path="students" element={<Students />} />
                  <Route path="students/create" element={<StudentForm />} />
                  <Route path="teams" element={<HeadmasterTeams />} />
                  <Route path="teams/create" element={<TeamForm />} />
                  <Route path="teams/:id" element={<TeamDetail />} />
                  <Route path="inspections" element={<HeadmasterInspections />} />
                  <Route path="inspections/:id" element={<InspectionDetail />} />
                  <Route path="analytics" element={<HeadmasterAnalytics />} />
                  <Route path="notifications" element={<HeadmasterNotifications />} />
                  <Route path="profile" element={<HeadmasterProfile />} />
                  <Route path="settings" element={<HeadmasterSettings />} />
                  <Route path="*" element={<Navigate to="/headmaster/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      
      {/* Office Routes */}
      <Route
        path="/office/*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-100">
              <OfficeSidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Routes>
                  <Route path="dashboard" element={<OfficeDashboard />} />
                  <Route path="inspections" element={<OfficeInspections />} />
                  <Route path="inspections/:id" element={<OfficeInspectionDetail />} />
                  <Route path="inspections/:id/respond" element={<ResponseForm />} />
                  <Route path="history" element={<OfficeHistory />} />
                  <Route path="analytics" element={<OfficeAnalytics />} />
                  <Route path="notifications" element={<OfficeNotifications />} />
                  <Route path="profile" element={<OfficeProfile />} />
                  <Route path="settings" element={<OfficeSettings />} />
                  <Route path="*" element={<Navigate to="/office/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      
      {/* Responder Routes */}
      <Route
        path="/responder/*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-100">
              <ResponderSidebar />
              <main className="flex-1 p-8 overflow-y-auto">
                <Routes>
                  <Route path="dashboard" element={<ResponderDashboard />} />
                  <Route path="inspections" element={<ResponderInspections />} />
                  <Route path="inspections/:id" element={<ResponderInspectionDetail />} />
                  <Route path="escalations" element={<ResponderEscalations />} />
                  <Route path="escalations/:id" element={<ResponderEscalationDetail />} />
                  <Route path="compliance" element={<ResponderCompliance />} />
                  <Route path="compliance/:officeId" element={<ResponderComplianceDetail />} />
                  <Route path="analytics" element={<ResponderAnalytics />} />
                  <Route path="reports" element={<ResponderReports />} />
                  <Route path="violations" element={<ResponderViolations />} />
                  <Route path="notifications" element={<ResponderNotifications />} />
                  <Route path="profile" element={<ResponderProfile />} />
                  <Route path="settings" element={<ResponderSettings />} />
                  <Route path="*" element={<Navigate to="/responder/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === 'headmaster' ? (
              <Navigate to="/headmaster/dashboard" replace />
            ) : user?.role === 'office' ? (
              <Navigate to="/office/dashboard" replace />
            ) : user?.role === 'responder' ? (
              <Navigate to="/responder/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
