import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const ProtectedRoute = ({ children, allowedRoles = ['user', 'staff', 'admin'] }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const userObj = storedUser ? JSON.parse(storedUser) : null;
  const userRole = userObj?.role || 'user';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !allowedRoles.includes(userRole)) {
    toast.error('You do not have permission to access this page');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
