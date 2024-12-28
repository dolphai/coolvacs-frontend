import React, { useState } from 'react';
import axios from 'axios';

export function FileUpload() {
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadStats, setUploadStats] = useState(null);
  const locations = ['Sangli', 'Kolhapur', 'Goa', 'Tasgaon'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !location) {
      setMessage('Please select both file and location');
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      setMessage('Please upload only Excel files (.xlsx or .xls)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('location', location);
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true // Important for CORS
      });

      setMessage(response.data.message);
      setUploadStats({
        recordsProcessed: response.data.records_processed,
        location: response.data.location
      });

      // Reset form
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Upload failed. Please try again.';
      setMessage(errorMessage);
      setUploadStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Upload Inventory</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Select Location:</label>
          <select
            className="w-full p-2 border rounded"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option value="">Select location...</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Upload Excel File:</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border rounded p-2"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported formats: .xlsx, .xls
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>

        {message && (
          <div 
            className={`mt-4 p-4 rounded ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}
          >
            <p>{message}</p>
            {uploadStats && (
              <div className="mt-2 text-sm">
                <p>Records processed: {uploadStats.recordsProcessed}</p>
                <p>Location: {uploadStats.location}</p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}