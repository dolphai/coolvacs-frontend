import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadButtons from './DownloadButtons';
import { Filter } from 'react-feather';

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

export function InventorySearch({ onSearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [filters, setFilters] = useState({
    minMrp: '',
    maxMrp: '',
    manufacturer: '',
    expiringInDays: '',
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'asc' });

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
      const role = JSON.parse(localStorage.getItem('user'))?.role || 'user';
      const response = await axios.get(`http://localhost:8000/search`, {
        params: {
          query: query.trim(),
          role
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
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
      const role = JSON.parse(localStorage.getItem('user'))?.role || 'user';
      const response = await axios.get(`http://localhost:8000/download-search`, {
        params: {
          query: query.trim(),
          format,
          role
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
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

  const handleClick = () => {
    onSearch(query);
  };

  const processedResults = useMemo(() => {
    if (!results) return [];
    
    let filtered = [...results];

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
  }, [results, filters, sortConfig]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto h-screen flex flex-col bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-6 sticky top-0 z-10 mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          {!hasSearched ? (
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search products or manufacturers..."
                  className="w-full p-4 pr-12 text-gray-900 border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <div className="px-4 py-2 bg-gray-100 rounded-lg flex-1 font-medium text-gray-700">
                Results for: "{query}"
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${showFilters 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              <Filter size={16} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {results.length > 0 && <DownloadButtons onDownload={handleDownload} />}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 mt-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Price Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min MRP"
                      value={filters.minMrp}
                      onChange={(e) => setFilters(prev => ({ ...prev, minMrp: e.target.value }))}
                      className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max MRP"
                      value={filters.maxMrp}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxMrp: e.target.value }))}
                      className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="Filter by manufacturer"
                    value={filters.manufacturer}
                    onChange={(e) => setFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
                    className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Expiring In</label>
                  <input
                    type="number"
                    placeholder="Days until expiry"
                    value={filters.expiringInDays}
                    onChange={(e) => setFilters(prev => ({ ...prev, expiringInDays: e.target.value }))}
                    className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-auto px-4">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="search-initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              {/* <div className="w-full max-w-2xl px-4">
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                  Search Inventory
                </h2>
              </div> */}
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
                ) : processedResults.length > 0 ? (
                  <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col min-h-0">
                    <div className="overflow-auto">
                      <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            {visibleColumns.map((column) => (
                              <th
                                key={column.key}
                                onClick={() => handleSort(column.key)}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                          {processedResults.map((item, index) => {
                            const expiryStatus = getExpiryStatus(item.expiry_date);
                            return (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`hover:bg-gray-50 transition-colors duration-150
                                  ${expiryStatus === 'expired' ? 'bg-red-50' : 
                                    expiryStatus === 'expiring-soon' ? 'bg-yellow-50' : ''}`}
                              >
                                {visibleColumns.map((column) => (
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
    </div>
  );
}

export default InventorySearch;