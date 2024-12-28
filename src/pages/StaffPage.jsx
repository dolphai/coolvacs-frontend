import React, { useState } from 'react';
import ExpiringProducts from '../components/ExpiringProducts';

export function StaffPage() {
  const [showExpiredProducts, setShowExpiredProducts] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Staff Dashboard</h1>
      
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
        
        {showExpiredProducts && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Expired Products</h2>
            <ExpiringProducts />
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffPage;
