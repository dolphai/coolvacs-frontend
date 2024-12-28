
// src/components/Admin.jsx
import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { InventorySearchAdmin } from './InventorySearchAdmin';
import { InventoryDisplayAdmin } from './InventoryDisplayAdmin';
import { encrypt, decrypt } from '../utils/encryption';
import { validateCredentials, generateToken } from '../utils/auth';

const REGULAR_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const EXTENDED_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const stored = localStorage.getItem('loginAttempts');
    return stored ? parseInt(stored) : 0;
  });

  useEffect(() => {
    localStorage.setItem('loginAttempts', loginAttempts.toString());
  }, [loginAttempts]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loginAttempts >= 5) {
      setError('Too many login attempts. Please try again later.');
      return;
    }

    if (validateCredentials(username, password)) {
      const sessionData = {
        token: generateToken(),
        timestamp: Date.now(),
        rememberMe
      };
      
      localStorage.setItem('adminSession', encrypt(sessionData));
      localStorage.removeItem('loginAttempts');
      setLoginAttempts(0);
      onLogin();
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      setError(`Invalid credentials. ${5 - newAttempts} attempts remaining.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loginAttempts >= 5}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loginAttempts >= 5}
            />
          </div>
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-500 rounded border-gray-300"
              disabled={loginAttempts >= 5}
            />
            <label htmlFor="rememberMe" className="ml-2 text-gray-700">
              Remember me for 30 days
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loginAttempts >= 5}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export function Admin({ onBack }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const validateSession = () => {
      const encryptedSession = localStorage.getItem('adminSession');
      if (!encryptedSession) return false;

      const sessionData = decrypt(encryptedSession);
      if (!sessionData) return false;

      const currentTime = Date.now();
      const sessionDuration = sessionData.rememberMe ? 
        EXTENDED_SESSION_DURATION : REGULAR_SESSION_DURATION;

      return (currentTime - sessionData.timestamp) < sessionDuration;
    };

    if (validateSession()) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      localStorage.removeItem('adminSession');
    }

    const interval = setInterval(() => {
      if (!validateSession()) {
        setIsLoggedIn(false);
        localStorage.removeItem('adminSession');
        onBack();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [onBack]);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('wasInAdminView');
    setIsLoggedIn(false);
    onBack();
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Medical Inventory Management</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Main View
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
        
        <FileUpload />
        <InventorySearchAdmin />
        <InventoryDisplayAdmin />
      </div>
    </div>
  );
}