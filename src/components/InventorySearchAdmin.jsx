import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadButtons from './DownloadButtons';

export function InventorySearchAdmin() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);

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

  const updateVisibleColumns = (data) => {
    const visibleCols = columns.filter(column => {
      return data.some(item => {
        const value = item[column.key];
        const formattedValue = column.format(value);
        return formattedValue !== 'N/A' && formattedValue !== '₹0.00' && formattedValue !== '0.00';
      });
    });
    setVisibleColumns(visibleCols);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `₹${value.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/search_admin`, {
        params: {
          query: query.trim(),
        },
      });
      setResults(response.data);
      updateVisibleColumns(response.data);
      setHasSearched(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred while searching');
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  const handleDownload = async (format) => {
    try {
      const response = await axios.get(`http://localhost:8000/download-search_admin`, {
        params: {
          query: query.trim(),
          format,
        },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `search_results_${query.slice(0, 30)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download results');
    }
  };

  const handleReset = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <motion.div
            key="search-initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <div className="w-full max-w-2xl px-4">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                Search Inventory
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by product name or manufacturer..."
                  className="flex-1 p-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200 disabled:bg-gray-400"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    'Search'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full"
          >
            <div className="bg-white shadow-md z-10">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1 max-w-3xl">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by product name or manufacturer..."
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSearch}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200 disabled:bg-gray-400 whitespace-nowrap"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Searching...</span>
                        </div>
                      ) : (
                        'Search'
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReset}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      Reset
                    </motion.button>
                  </div>
                  {results.length > 0 && <DownloadButtons onDownload={handleDownload} />}
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 py-6 flex-1 flex flex-col min-h-0">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : results.length > 0 ? (
                <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col min-h-0">
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          {visibleColumns.map((column) => (
                            <th
                              key={column.key}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.map((item, index) => (
                          <motion.tr
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={index}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            {visibleColumns.map((column) => (
                              <td
                                key={column.key}
                                className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                              >
                                {column.format(item[column.key])}
                              </td>
                            ))}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-600"
                >
                  No results found
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}