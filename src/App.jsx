import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppProvider } from './lib/store';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Lazy loading for code-splitting (Speed & Bundle Optimization)
const CustomerApp = React.lazy(() => import('./components/customer/CustomerApp').then(module => ({ default: module.CustomerApp })));
const KitchenApp = React.lazy(() => import('./components/kitchen/KitchenApp').then(module => ({ default: module.KitchenApp })));
const ManagerApp = React.lazy(() => import('./components/manager/ManagerApp').then(module => ({ default: module.ManagerApp })));
const AdminApp = React.lazy(() => import('./components/admin/AdminApp').then(module => ({ default: module.AdminApp })));
const StaffPortal = React.lazy(() => import('./components/auth/StaffPortal').then(module => ({ default: module.StaffPortal })));

// Fallback loader for Suspense
const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-500 will-change-transform" />
  </div>
);

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ErrorBoundary sectionName="Application Root">
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
