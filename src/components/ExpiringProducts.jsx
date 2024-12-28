import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'normal';
  const today = new Date();
  const expiry = new Date(expiryDate);
  const oneWeek = new Date();
  oneWeek.setDate(today.getDate() + 7);
  
  if (expiry < today) return 'expired';
  if (expiry <= oneWeek) return 'expiring-soon';
  return 'normal';
};

export default function ExpiringProducts() {
  const [selectedLocation, setSelectedLocation] = useState('');
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
    { key: 'closing_balance_value', label: 'Stock Value', format: value => formatCurrency(value) },
    { key: 'location', label: 'Location', format: value => value }
  ];

  const { data: expiringProducts, isLoading } = useQuery(
    ['expiring-products', selectedLocation],
    async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get('http://localhost:8000/expiring-inventory', {
        params: { 
          days: 90,
          location: selectedLocation,
          role: user.role 
        },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Ensure the data is always an array
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('Processed data:', data);
      return data;
    },
    {
      enabled: true,
      onSuccess: (data) => {
        console.log('Query succeeded with data:', data);
      },
      onError: (error) => {
        console.error('Query failed:', error);
        console.error('Error response:', error.response);
        toast.error('Failed to fetch expiring products');
      }
    }
  );

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get('http://localhost:8000/expiring-inventory', {
        params: { 
          days: 90,
          format,
          location: selectedLocation,
          role: user.role 
        },
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      // Create and trigger download
      const blob = new Blob([response.data], {
        type: format === 'csv' 
          ? 'text/csv;charset=utf-8;' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expiring-products.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to download file');
    }
  };

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

  const filteredProducts = useMemo(() => {
    console.log('Current data:', expiringProducts);
    if (!expiringProducts) return [];
    
    return selectedLocation
      ? expiringProducts.filter(item => 
          item.location?.toLowerCase() === selectedLocation.toLowerCase())
      : expiringProducts;
  }, [expiringProducts, selectedLocation]);

  return (
    <div className="h-[600px] flex flex-col bg-white rounded-lg shadow"> {/* Add fixed height and flex column */}
      <div className="p-4 border-b">  {/* Header section */}
        <div className="flex gap-4 items-center">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="p-2 border rounded flex-1"
          >
            <option value="">Select Location</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 whitespace-nowrap"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto"> {/* Scrollable content area */}
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredProducts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10"> {/* Make header sticky */}
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((item, index) => {
                  const expiryStatus = getExpiryStatus(item.expiry_date);
                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        ${expiryStatus === 'expired' ? 'bg-red-50' : 
                          expiryStatus === 'expiring-soon' ? 'bg-yellow-50' : ''}
                      `}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-6 py-4 whitespace-nowrap
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
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-gray-500">
              {selectedLocation ? 'No expiring products found' : 'No expiring products found in any location'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
