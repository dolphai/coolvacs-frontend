import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadButtons from './DownloadButtons';
import { Menu } from '@headlessui/react';
import { ChevronDown, Filter, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from 'react-hot-toast';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'normal';
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const oneWeek = new Date();
  oneWeek.setDate(today.getDate() + 7);
  
  if (expiry < today) {
    return 'expired';
  } else if (expiry <= oneWeek) {
    return 'expiring-soon';
  }
  return 'normal';
};

export function InventoryDisplay({ data }) {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState({
    minMrp: '',
    maxMrp: '',
    manufacturer: '',
    expiringInDays: '',
    searchQuery: ''
  });
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'asc' });
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const locations = ['Sangli', 'Kolhapur', 'Goa', 'Tasgaon'];

  const columns = [
    { key: 'product_id', label: 'Product ID', format: value => value || 'N/A' },
    { key: 'item_name', label: 'Product Name', format: value => value },
    { key: 'manufacturer', label: 'Manufacturer', format: value => value },
    { key: 'supplier', label: 'Supplier', format: value => value || 'N/A' },
    { key: 'bill_no', label: 'Bill No', format: value => value || 'N/A' },
    { key: 'stock_in_date', label: 'Stock In Date', format: value => formatDate(value) },
    { key: 'expiry_date', label: 'Expiry Date', format: value => formatDate(value) },
    { key: 'mrp', label: 'MRP', format: value => formatCurrency(value) },
    { key: 'sales_rate', label: 'Sales Rate', format: value => formatCurrency(value) },
    { key: 'gst_percentage', label: 'GST %', format: value => formatNumber(value) },
    { key: 'closing_balance_qty', label: 'Stock Qty', format: value => formatNumber(value) },
    { key: 'closing_balance_value', label: 'Stock Value', format: value => formatCurrency(value) }
  ];

  // Fetch inventory data using React Query
  const { data: inventoryData, isLoading, error, refetch } = useQuery(
    ['inventory', location, filters],
    async () => {
      if (!location) return [];
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view inventory');
        navigate('/login');
        return [];
      }

      try {
        const response = await axios.get(`http://localhost:8000/inventory/${location}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            role: JSON.parse(localStorage.getItem('user'))?.role || 'user',
            ...filters
          }
        });
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again');
          localStorage.clear();
          navigate('/login');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to view this data');
          navigate('/');
        } else {
          toast.error(error.response?.data?.detail || 'Failed to fetch inventory data');
        }
        throw error;
      }
    },
    {
      enabled: !!location,
      retry: false
    }
  );

  // Format helpers
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `₹${Number(value).toFixed(2)}`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return Number(value).toFixed(2);
  };

  // Handle sorting
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!inventoryData) return [];
    
    let filtered = [...inventoryData];

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.item_name?.toLowerCase().includes(query) ||
        item.manufacturer?.toLowerCase().includes(query)
      );
    }

    if (filters.minMrp) {
      filtered = filtered.filter(item => Number(item.mrp) >= Number(filters.minMrp));
    }

    if (filters.maxMrp) {
      filtered = filtered.filter(item => Number(item.mrp) <= Number(filters.maxMrp));
    }

    if (filters.manufacturer) {
      filtered = filtered.filter(item => 
        item.manufacturer?.toLowerCase().includes(filters.manufacturer.toLowerCase())
      );
    }

    if (filters.expiringInDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + Number(filters.expiringInDays));
      filtered = filtered.filter(item => 
        item.expiry_date && new Date(item.expiry_date) <= cutoffDate
      );
    }

    // Apply sorting
    if (sortConfig.field) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.order === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [inventoryData, filters, sortConfig]);

  // Handle downloads
  const handleDownload = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await axios.get(`http://localhost:8000/download/${location}`, {
        params: { 
          format,
          role: user.role
        },
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: format === 'csv' 
          ? 'text/csv;charset=utf-8;' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_${location}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error('Failed to download inventory');
      console.error('Download error:', error);
    }
  };

  // Reset filters
  const handleReset = () => {
    setFilters({
      minMrp: '',
      maxMrp: '',
      manufacturer: '',
      expiringInDays: '',
      searchQuery: ''
    });
    setSortConfig({ field: null, order: 'asc' });
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Controls Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Select location...</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
          >
            <Filter size={16} />
            Filters
          </button>

          {location && processedData.length > 0 && (
            <DownloadButtons onDownload={handleDownload} />
          )}

          {Object.values(filters).some(Boolean) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="p-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Min MRP"
                  value={filters.minMrp}
                  onChange={(e) => setFilters(prev => ({ ...prev, minMrp: e.target.value }))}
                  className="p-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max MRP"
                  value={filters.maxMrp}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxMrp: e.target.value }))}
                  className="p-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Manufacturer"
                  value={filters.manufacturer}
                  onChange={(e) => setFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
                  className="p-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Expiring in days"
                  value={filters.expiringInDays}
                  onChange={(e) => setFilters(prev => ({ ...prev, expiringInDays: e.target.value }))}
                  className="p-2 border rounded-lg"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-4">
              Failed to load inventory data
            </div>
          ) : processedData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100"
                      >
                        {column.label}
                        {sortConfig.field === column.key && (
                          <span>{sortConfig.order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.map((item, index) => {
                    const expiryStatus = getExpiryStatus(item.expiry_date);
                    return (
                      <motion.tr
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={index}
                        className={`hover:bg-gray-50 transition-colors duration-150 
                          ${expiryStatus === 'expired' ? 'bg-red-50' : 
                            expiryStatus === 'expiring-soon' ? 'bg-yellow-50' : ''}`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-6 py-4 whitespace-nowrap text-sm
                              ${column.key === 'expiry_date' ? 
                                (expiryStatus === 'expired' ? 'text-red-600 font-medium' : 
                                 expiryStatus === 'expiring-soon' ? 'text-yellow-600 font-medium' : 
                                 'text-gray-900') : 
                                'text-gray-900'}`}
                          >
                            {column.format(item[column.key])}
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-600"
            >
              No inventory data found for {location}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryDisplay;