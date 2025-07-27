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
import Dashboard from "./pages/Dashboard/Dashboard";
import ExcelAnalyzer from "./pages/Analysis/ExcelAnalyzer";
import ExcelAnalyzerZ from "./pages/Analysis/ExcelAnalyzerZ";
import SheetsComparison from "./pages/Analysis/SheetsComparison";
import TowerSearch from "./pages/Towers/TowerSearch";

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

      <Route
        path="/excel-analyzer"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ExcelAnalyzer />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/excel-analyzer-z"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ExcelAnalyzerZ />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sheets-comparison"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SheetsComparison />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/site-search"
        element={
          <ProtectedRoute>
            <MainLayout>
              <TowerSearch />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Only Routes */}
      <Route
        path="/site-management"
        element={
          <ProtectedRoute adminOnly>
            <MainLayout>
              <div>Site Management Page - To be implemented</div>
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