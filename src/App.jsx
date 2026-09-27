import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { CustomerApp } from './components/customer/CustomerApp';
import { KitchenApp } from './components/kitchen/KitchenApp';
import { ManagerApp } from './components/manager/ManagerApp';
import { AdminApp } from './components/admin/AdminApp';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { StaffPortal } from './components/auth/StaffPortal';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary sectionName="Application Root">
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
            <Routes>
              <Route 
                path="/" 
                element={
                  <ErrorBoundary sectionName="Customer Portal">
                    <CustomerApp />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/menu" 
                element={
                  <ErrorBoundary sectionName="Digital Menu">
                    <CustomerApp />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/staff" 
                element={
                  <ErrorBoundary sectionName="Staff Portal">
                    <StaffPortal />
                  </ErrorBoundary>
                } 
              />
              <Route
                path="/kitchen"
                element={
                  <ErrorBoundary sectionName="Kitchen Display System">
                    <ProtectedRoute role="kitchen">
                      <KitchenApp />
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/manager"
                element={
                  <ErrorBoundary sectionName="Manager Control Panel">
                    <ProtectedRoute role="manager">
                      <ManagerApp />
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/admin"
                element={
                  <ErrorBoundary sectionName="Admin Super Portal">
                    <ProtectedRoute role="admin">
                      <AdminApp />
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
