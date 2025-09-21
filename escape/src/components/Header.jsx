import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const Header = () => {
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

  // Check if current user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <header className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                <img 
                  src="/assets/logo.svg" 
                  alt="Escape Logo" 
                  className="w-8 h-8 object-contain" 
                />
              </div>
            </Link>
            <Link to="/" className="text-2xl font-bold text-gray-900">scape</Link>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Link 
              to="/bargain" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200"
            >
              Bargain
            </Link>

            {/* Your Bargains button - Only for non-admin users */}
            {!isAdmin && (
              <Link 
                to="/your-bargains" 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200"
              >
                Your Bargains
              </Link>
            )}

            {/* Search functionality */}
            <div className="relative">
              <button 
                onClick={toggleSearch}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                Search
              </button>

              {showSearch && (
                <div className="absolute top-full right-0 mt-2 w-72 z-60">
                  <form onSubmit={handleSearchSubmit}>
                    <input
                      type="text"
                      placeholder="Search destinations, packages..."
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                    />
                  </form>
                </div>
              )}
            </div>

            <Link 
              to="/cart" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200"
            >
              Cart
            </Link>

            {/* Admin Dashboard Button - Show ONLY if user is admin */}
            {isAdmin && (
              <Link 
                to="/admin-dashboard"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                Admin Dashboard
              </Link>
            )}

            {/* Authentication Section - Only show if signed in */}
            {isSignedIn && (
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  Welcome, {user?.firstName || user?.publicMetadata?.fullName || 'User'}!
                  {isAdmin && <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Admin</span>}
                </span>
                <UserButton afterSignOutUrl="/" />
              </div>
            )}

            <button className="text-2xl cursor-pointer hover:scale-110 transition-transform duration-200 ml-2">
              🌐
            </button>
          </nav>

          <button className="md:hidden text-gray-700 text-2xl">☰</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
