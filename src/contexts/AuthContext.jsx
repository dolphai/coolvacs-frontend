import { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const isValid = await checkAuth();
        if (isValid) {
          setIsAuthenticated(true);
          setUser(JSON.parse(localStorage.getItem('user')));
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    validateAuth();
  }, []);

  const value = {
    isAuthenticated,
    user,
    loading,
    setAuth: (status, userData = null) => {
      setIsAuthenticated(status);
      setUser(userData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add this check in your login function or wherever you set the user data:

const login = async (credentials) => {
  try {
    // ...existing login code...
    
    // Make sure role is properly stored
    localStorage.setItem('user', JSON.stringify({
      ...response.data.user,
      role: response.data.user.role.toLowerCase() // ensure role is lowercase
    }));
    
    // ...rest of login code...
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
