import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const data = params.get('data');
        if (!data) throw new Error('No auth data received');

        const authData = JSON.parse(atob(data));
        
        localStorage.setItem('token', authData.access_token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        setAuth(true, authData.user);
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Login failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default OAuthCallback;
