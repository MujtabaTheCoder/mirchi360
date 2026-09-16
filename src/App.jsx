import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { CustomerApp } from './components/customer/CustomerApp';
import { KitchenApp } from './components/kitchen/KitchenApp';
import { ManagerApp } from './components/manager/ManagerApp';
import { AdminApp } from './components/admin/AdminApp';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { StaffPortal } from './components/auth/StaffPortal';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
          <Routes>
            <Route path="/" element={<CustomerApp />} />
            <Route path="/menu" element={<CustomerApp />} />
            <Route path="/staff" element={<StaffPortal />} />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute role="kitchen">
                  <KitchenApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute role="manager">
                  <ManagerApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminApp />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
