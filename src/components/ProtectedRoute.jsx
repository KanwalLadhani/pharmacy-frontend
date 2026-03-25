import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards routes by authentication and optional role.
 * @param {string} requiredRole - e.g. 'ROLE_ADMIN'. If omitted, just checks auth.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="forbidden-page">
        <div className="forbidden-card">
          <div className="forbidden-icon">🔒</div>
          <h1>403 — Access Denied</h1>
          <p>You don't have permission to view this page.</p>
          <p className="forbidden-role">
            Required role: <strong>{requiredRole.replace('ROLE_', '')}</strong>
          </p>
          <button
            className="btn-primary"
            onClick={() => window.history.back()}
            style={{ marginTop: '20px' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
