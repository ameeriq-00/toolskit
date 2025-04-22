// frontend/src/Routes.js

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ExcelAnalyzer from './pages/ExcelAnalyzer';
import ExcelAnalyzerZ from './pages/ExcelAnalyzerZ';
import SiteInformationUpload from './components/SiteInformationUpload';
import Login from './pages/Login';
import Home from './pages/Home';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/excel-analyzer" element={
        <ProtectedRoute>
          <ExcelAnalyzer />
        </ProtectedRoute>
      } />
      <Route path="/excel-analyzer-z" element={
        <ProtectedRoute>
          <ExcelAnalyzerZ />
        </ProtectedRoute>
      } />
      <Route path="/upload-site-information" element={
        <ProtectedRoute adminOnly={true}>
          <SiteInformationUpload />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;