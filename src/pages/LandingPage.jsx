import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchBar } from '../components/SearchBar';
import InventorySearch from '../components/InventorySearch';
import InventoryDisplay from '../components/InventoryDisplay';
import { SearchResults } from '../components/SearchResults';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/search', {
        params: {
          query: searchQuery.trim(),
          role: 'user'
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold mb-6">Coolvaccs Agencies</h1>
            <p className="text-xl mb-8">Your Trusted Partner in Medical Distribution</p>
            
          </motion.div>
        </div>
      </div>

      {/* Company Info */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-4">About Us</h2>
            <p className="text-gray-600 leading-relaxed">
              Coolvaccs Agencies is a leading distributor of medical supplies and equipment,
              serving healthcare providers across the region since 2010. We pride ourselves
              on delivering high-quality products and exceptional service to our clients.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <ul className="space-y-3 text-gray-600">
              <li>✓ Wide range of medical supplies</li>
              <li>✓ Quick delivery services</li>
              <li>✓ Competitive pricing</li>
              <li>✓ Quality assurance</li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            to="/inventory"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Our Inventory
          </Link>
        </motion.div>
      </div>

      <div>
        <InventorySearch onSearch={handleSearch} />
        <InventoryDisplay data={searchResults} />
      </div>

      <div className="container mx-auto px-4 py-8">
        <SearchResults 
          results={searchResults} 
          isLoading={isSearching} 
        />
      </div>
    </div>
  );
};

export default LandingPage;
