import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const UserHeader = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  const toggleSearch = () => setShowSearch(prev => !prev);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') handleSearchSubmit(e);
  };

  const handleBookingsClick = () => navigate('/bookings');

  return (
    <header 
      className="relative shadow-lg fixed w-full top-0 z-50 overflow-hidden" 
      style={{ minHeight: '160px' }}
    >
      {/* Full background image */}
      <img
        src="/assets/image.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        draggable={false}
        aria-hidden="true"
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/40 z-10" />
      
      <div className="relative z-20 max-w-6xl mx-auto px-5 flex items-center min-h-[160px] justify-between w-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/">
            <div className="w-20 h-20 flex items-center justify-center">
              <img 
                src="/assets/logo.svg" 
                alt="Escape Logo" 
                className="w-19 h-19 object-contain" 
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link 
            to="/bargain" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200"
          >
            Bargain
          </Link>
          <Link 
            to="/your-bargains" 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200"
          >
            Your Bargains
          </Link>
          {isSignedIn && (
            <button
              onClick={handleBookingsClick}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Your Bookings
            </button>
          )}
          {/* Search */}
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
                    onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          {isSignedIn && (
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                Welcome, {user?.firstName || user?.publicMetadata?.fullName || 'User'}!
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
          <button className="text-2xl cursor-pointer hover:scale-110 transition-transform duration-200 ml-2">
            🌐
          </button>
        </nav>
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          {isSignedIn && (
            <button
              onClick={handleBookingsClick}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-1 text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Bookings
            </button>
          )}
          <button className="text-gray-700 text-2xl">☰</button>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
