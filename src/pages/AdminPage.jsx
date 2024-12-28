import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ExpiringProducts from '../components/ExpiringProducts'; // Change this line

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STAFF',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExpiredProducts, setShowExpiredProducts] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update fetchUsers with better error handling
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch users';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Update form submission handlers with validation
  const createUser = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/admin/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setFormData({ email: '', password: '', name: '', role: 'STAFF' });
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create user';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/admin/users/${selectedUser.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      setIsEditing(false);
      setSelectedUser(null);
      setFormData({ email: '', password: '', name: '', role: 'STAFF' });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
      console.error(error);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/admin/users/${userId}/reset-password`, 
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Password reset successful');
    } catch (error) {
      toast.error('Failed to reset password');
      console.error(error);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      password: ''  // Clear password field for security
    });
    setIsEditing(true);
  };

  const fetchInventory = async (location) => {
    try {
      console.log("Fetching inventory for location:", location);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/inventory/${location}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        params: {
          role: 'admin'  // Explicitly set role
        }
      });
      
      console.log("Inventory response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setInventory(response.data);
      } else {
        console.error("Invalid inventory data format:", response.data);
        setInventory([]);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      console.error("Error response:", error.response);
      toast.error('Failed to fetch inventory data');
      setInventory([]);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8000/api/auth/forgot-password',
        { email: formData.email },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data) {
        toast.success('Reset instructions sent to your email if account exists');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      console.log('Error response:', error.response);
      toast.error(error.response?.data?.error || 'Failed to process request');
    }
  };

  // Add proper loading and error states to the UI
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchUsers}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Add toggle button for expired products */}
      <div className="mb-8">
        <button
          onClick={() => setShowExpiredProducts(!showExpiredProducts)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showExpiredProducts
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showExpiredProducts ? 'Hide Expired Products' : 'Show Expired Products'}
        </button>
        
        {/* Show ExpiringProducts component conditionally */}
        {showExpiredProducts && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Expired Products</h2>
            <ExpiringProducts />
          </div>
        )}
      </div>

      {/* Existing user management section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
        {/* Add loading indicator */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <div className="mt-2 text-center">Loading...</div>
            </div>
          </div>
        )}

        {/* User Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h2>
          <form onSubmit={isEditing ? updateUser : createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className={`p-2 border rounded ${!formData.email && 'border-red-500'}`}
                required
              />
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                className="p-2 border rounded"
              />
              <input
                type="password"
                name="password"
                placeholder={isEditing ? "New Password (leave blank to keep current)" : "Password"}
                value={formData.password}
                onChange={handleInputChange}
                className="p-2 border rounded"
                {...(isEditing ? {} : { required: true })}
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              >
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="USER">User</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : isEditing ? 'Update User' : 'Create User'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedUser(null);
                    setFormData({ email: '', password: '', name: '', role: 'STAFF' });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Update users table with loading state */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          {users.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 
                          user.role === 'STAFF' ? 'bg-green-100 text-green-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {user.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => resetPassword(user.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;