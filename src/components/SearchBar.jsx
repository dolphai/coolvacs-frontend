import React from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({ value, onChange, onSearch, placeholder, className }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="w-full px-4 py-3 pl-12 rounded-lg bg-white/10 backdrop-blur-sm border 
                 border-white/20 text-white placeholder-white/70 focus:outline-none 
                 focus:ring-2 focus:ring-white/50"
      />
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
    </form>
  );
};
