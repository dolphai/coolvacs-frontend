// src/utils/auth.js
import CryptoJS from 'crypto-js';

const HASH_SALT = 'your-secure-salt-123'; // Move to .env in production

const hashPassword = (password) => {
  return CryptoJS.SHA256(password + HASH_SALT).toString();
};

export const generateToken = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

// Store hashed password instead of plain text
const ADMIN_CREDENTIALS = {
  username: 'aastha',
  passwordHash: hashPassword('aavika')
};

export const validateCredentials = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const response = await fetch('/api/auth/check', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
