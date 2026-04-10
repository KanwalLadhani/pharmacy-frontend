import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import SalesHistory from './pages/SalesHistory';
import UserManagement from './pages/UserManagement';
import ShiftClosing from './pages/ShiftClosing';

/**
 * HomeRedirect - Decides where to send the user after successful login
 * depending on their role.
 */
const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'ROLE_ADMIN') {
    return <Dashboard />;
  }
  return <Navigate to="/billing" replace />;
};

function App() {
  useEffect(() => {
    document.title = "Medi-Store";
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes — require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* The index route (/) now uses HomeRedirect to split roles */}
            <Route index element={<HomeRedirect />} />
            
            <Route path="inventory" element={<Inventory />} />
            
            <Route path="users" element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <UserManagement />
              </ProtectedRoute>
            } />

            {/* Pharmacist routes */}
            <Route path="billing" element={<Billing />} />
            <Route path="shift-closing" element={
              <ProtectedRoute requiredRole="ROLE_PHARMACIST">
                <ShiftClosing />
              </ProtectedRoute>
            } />
            <Route path="sales-history" element={
              <ProtectedRoute requiredRole="ROLE_PHARMACIST">
                <SalesHistory />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
