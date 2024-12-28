import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import VerifyOTP from './components/VerifyOTP';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import OAuthCallback from './components/OAuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import { QueryClient, QueryClientProvider } from 'react-query';
import StaffPage from './pages/StaffPage'; // Change to default import
import { LoadingScreen } from './components/LoadingScreen';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'rounded-lg shadow-md',
              duration: 3000,
              style: {
                background: '#fff',
                color: '#363636',
              },
            }}
          />
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-otp" element={<VerifyOTP />} />
                  <Route path="/oauth/callback" element={<OAuthCallback />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff" element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffPage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </div>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;