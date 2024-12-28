// src/services/authService.js

const API_URL = 'http://localhost:8000';

export const authService = {
  async register(userData) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async getCurrentUser() {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: this.getAuthHeader(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(error.message);
    }
  },
};