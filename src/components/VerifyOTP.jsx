import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { verifyOTP, resendOTP } from '../services/api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get userId from state or URL params
  const params = new URLSearchParams(location.search);
  const userId = location.state?.userId || params.get('userId');
  const email = location.state?.email || params.get('email');

  // Redirect if no userId or email is present
  if (!userId || !email) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name=otp-${index + 1}]`);
      nextInput?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(userId);
      setTimeLeft(300);
      toast.success('New OTP sent successfully');
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const otpString = otp.join('');
      const response = await verifyOTP(otpString, userId);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      toast.success('Email verified successfully');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                name={`otp-${index}`}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-12 h-12 text-center text-xl border-2 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            ))}
          </div>

          <div className="text-center text-sm text-gray-600">
            {timeLeft > 0 ? (
              <p>Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otp.some(digit => !digit)}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading || otp.some(digit => !digit) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
