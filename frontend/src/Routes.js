import React from "react";
import { Route, Routes } from "react-router-dom";
import ExcelAnalyzer from "./pages/ExcelAnalyzer";
import ExcelAnalyzerZ from "./pages/ExcelAnalyzerZ";
import SheetsComparison from "./pages/SheetsComparison";
import SiteSearchPage from "./pages/SiteSearchPage"; // جديد
import SiteManagementPage from "./pages/SiteManagementPage"; // جديد (للأدمن)
import SiteInformationUpload from "./components/SiteInformationUpload"; // القديم (سنبقيه للتوافق)
import Login from "./pages/Login";
import Home from "./pages/Home";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
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

      {/* صفحة البحث الجديدة - متاحة لجميع المستخدمين */}
      <Route
        path="/site-search"
        element={
          <ProtectedRoute>
            <SiteSearchPage />
          </ProtectedRoute>
        }
      />

      {/* صفحة إدارة الأبراج الجديدة - للأدمن فقط */}
      <Route
        path="/site-management"
        element={
          <ProtectedRoute adminOnly={true}>
            <SiteManagementPage />
          </ProtectedRoute>
        }
      />

      {/* الصفحة القديمة - محتفظين بها للتوافق العكسي */}
      <Route
        path="/upload-site-information"
        element={
          <ProtectedRoute adminOnly={true}>
            <SiteInformationUpload />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
