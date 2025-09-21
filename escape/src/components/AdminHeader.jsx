import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const AdminHeader = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const handleDashboardClick = () => {
    navigate('/admin-dashboard');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo Section - Enhanced with better spacing and typography */}
          <div className="flex items-center gap-3">
            <Link to="/" className="group">
              <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <img 
                  src="/assets/logo.svg" 
                  alt="Escape Logo" 
                  className="w-7 h-7 object-contain" 
                />
              </div>
            </Link>
            <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight hover:text-teal-600 transition-colors duration-200">
              escape
            </Link>
          </div>

          {/* Desktop Navigation - Enhanced with modern styling */}
          <nav className="hidden md:flex items-center gap-3">
            {/* Dashboard Button - Improved with better visual hierarchy */}
            {isSignedIn && (
              <button
                onClick={handleDashboardClick}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md group"
              >
                <svg className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7m0 0V5a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
                </svg>
                Dashboard
              </button>
            )}

            {/* Search functionality - Enhanced with smoother animations */}
            <div className="relative">
              <button 
                onClick={toggleSearch}
                className={`${showSearch ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md group`}
              >
                <svg className={`h-4 w-4 transition-all duration-200 ${showSearch ? 'rotate-90 scale-110' : 'group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                Search
              </button>

              {/* Enhanced search dropdown with smooth animations */}
              {showSearch && (
                <div className="absolute top-full right-0 mt-2 w-80 z-60 animate-in slide-in-from-top-2 duration-200">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search destinations, packages..."
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm text-gray-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition-all duration-200"
                        onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Authentication Section - Enhanced with modern admin badge */}
            {isSignedIn && (
              <div className="flex items-center gap-4 ml-2">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.firstName || user?.publicMetadata?.fullName || 'User'}
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-xs bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                        Admin
                      </span>
                    </div>
                  </div>
                  <div className="ring-2 ring-gray-100 rounded-full hover:ring-gray-200 transition-all duration-200">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </div>
              </div>
            )}

            {/* Language Toggle - Enhanced with better hover effect */}
            <button className="w-10 h-10 flex items-center justify-center text-xl cursor-pointer hover:bg-gray-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
              🌐
            </button>
          </nav>

          {/* Mobile Menu - Enhanced with consistent styling */}
          <div className="md:hidden flex items-center gap-2">
            {isSignedIn && (
              <button
                onClick={handleDashboardClick}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 text-sm shadow-sm group"
              >
                <svg className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7m0 0V5a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
                </svg>
                Dashboard
              </button>
            )}
            <button className="text-gray-700 text-xl hover:bg-gray-50 p-2 rounded-lg transition-all duration-200 hover:scale-110">
              ☰
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
