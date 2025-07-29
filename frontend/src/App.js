import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import darkTheme from "./theme/darkTheme";

// Layout Components
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import Login from "./pages/Auth/Login";
import PersonalSecurity from "./pages/Auth/PersonalSecurity";
import Dashboard from "./pages/Dashboard/Dashboard";
import ExcelAnalyzer from "./pages/Analysis/ExcelAnalyzer";
import ExcelAnalyzerZ from "./pages/Analysis/ExcelAnalyzerZ";
import SheetsComparison from "./pages/Analysis/SheetsComparison";
import TowerSearch from "./pages/Towers/TowerSearch";
import UserManagement from "./pages/Admin/UserManagement";
import SystemActivities from "./pages/Admin/SystemActivities";
import SecurityAlerts from "./pages/Admin/SecurityAlerts";

// Component to handle routing logic
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Loading is handled in ProtectedRoute
  }

  return (
    <Routes>
      {/* Public Route - Login */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" replace />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Analysis Routes */}
      <Route
        path="/excel-analyzer"
        element={
          <ProtectedRoute requiredPermissions={["analyze_excel"]}>
            <MainLayout>
              <ExcelAnalyzer />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/excel-analyzer-z"
        element={
          <ProtectedRoute requiredPermissions={["analyze_excel"]}>
            <MainLayout>
              <ExcelAnalyzerZ />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sheets-comparison"
        element={
          <ProtectedRoute requiredPermissions={["compare_sheets"]}>
            <MainLayout>
              <SheetsComparison />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Towers Routes */}
      <Route
        path="/site-search"
        element={
          <ProtectedRoute requiredPermissions={["search_sites"]}>
            <MainLayout>
              <TowerSearch />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/site-management"
        element={
          <ProtectedRoute
            requiredPermissions={["upload_sites", "manage_sites"]}
            requireAny
          >
            <MainLayout>
              <div>Site Management Page - To be implemented</div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/user-management"
        element={
          <ProtectedRoute requiredPermissions={["view_users"]}>
            <MainLayout>
              <UserManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/system-activities"
        element={
          <ProtectedRoute requiredPermissions={["view_activities"]}>
            <MainLayout>
              <SystemActivities />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-alerts"
        element={
          <ProtectedRoute requiredPermissions={["view_security_alerts"]}>
            <MainLayout>
              <SecurityAlerts />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Personal Routes */}
      <Route
        path="/my-security"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PersonalSecurity />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div>Settings Page - To be implemented</div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Change Password Route */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PersonalSecurity />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to dashboard or login */}
      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
