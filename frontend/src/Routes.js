import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ExcelAnalyzer from "./pages/ExcelAnalyzer";
import ExcelAnalyzerZ from "./pages/ExcelAnalyzerZ";
import SheetsComparison from "./pages/SheetsComparison";
import SiteSearchPage from "./pages/SiteSearchPage";
import SiteManagementPage from "./pages/SiteManagementPage";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/excel-analyzer"
        element={
          <ProtectedRoute>
            <ExcelAnalyzer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/excel-analyzer-z"
        element={
          <ProtectedRoute>
            <ExcelAnalyzerZ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sheets-comparison"
        element={
          <ProtectedRoute>
            <SheetsComparison />
          </ProtectedRoute>
        }
      />
      <Route
        path="/site-search"
        element={
          <ProtectedRoute>
            <SiteSearchPage />
          </ProtectedRoute>
        }
      />
      {user?.is_staff && (
        <Route
          path="/site-management"
          element={
            <ProtectedRoute>
              <SiteManagementPage />
            </ProtectedRoute>
          }
        />
      )}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
