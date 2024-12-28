import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Admin } from '../components/Admin';
import { InventorySearch } from '../components/InventorySearch';
import { InventoryDisplay } from '../components/InventoryDisplay';

const InventoryPage = () => {
  const [showAdmin, setShowAdmin] = useState(() => {
    return localStorage.getItem('wasInAdminView') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('user');

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
    const userData = localStorage.getItem('user');
    if (userData) {
      setRole(JSON.parse(userData).role || 'user');
    }
  }, []);

  const handleAdminView = (value) => {
    setShowAdmin(value);
    localStorage.setItem('wasInAdminView', value.toString());
  };

  const allColumns = [
    'product_id','item_name','manufacturer','supplier','bill_no','stock_in_date',
    'expiry_date','mrp','sales_rate','gst_percentage','closing_balance_qty',
    'closing_balance_value','location','contact_number'
  ];
  const staffColumns = [
    'item_name','manufacturer','expiry_date','mrp','location','closing_balance_qty',
    'contact_number','gst_percentage'
  ];
  const userColumns = [
    'item_name','mrp','location','contact_number'
  ];
  
  const columns = role === 'admin'
    ? allColumns 
    : (role === 'staff' ? staffColumns : userColumns);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Inventory</h1>
          <button
            onClick={() => handleAdminView(!showAdmin)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {showAdmin ? 'Exit Admin View' : 'Enter Admin View'}
          </button>
        </div>
        <AnimatePresence>
          {showAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Admin />
            </motion.div>
          ) : (
            <motion.div
              key="inventory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InventorySearch />
              <InventoryDisplay columns={columns} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InventoryPage;
