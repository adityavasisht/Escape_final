import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import WelcomePopup from './WelcomePopup';

const UserHeader = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const navButtonClass = "h-11 px-5 md:px-6 rounded-md border-2 border-white text-white bg-white/20 transition-colors duration-200 inline-flex items-center gap-2 shadow-md hover:bg-white/40 whitespace-nowrap";

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

  // Open signup popup if URL has ?signup=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('signup') === '1') {
      setShowWelcome(true);
      // remove the query param from URL without reload
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);

  return (
    <>
    {/* Global signup modal for logged-out users */}
    <WelcomePopup isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    <header 
      className="relative shadow-lg fixed w-full top-0 z-50 overflow-hidden" 
      style={{ minHeight: '160px' }}
    >
      {/* Full background image */}
      <img
        src="/assets/Screenshot%202025-09-18%20at%202.46.05%E2%80%AFPM.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0 opacity-[0.85]"
        draggable={false}
        aria-hidden="true"
      />
      {/* No overlay; image opacity controls visibility */}
      <div className="absolute inset-0 bg-transparent z-10" />
      
      {/* Absolutely positioned logo near screen edge */}
      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 z-30">
        <Link to="/">
          <div className="w-[160px] h-[160px] flex items-center justify-center">
            <img 
              src="/assets/logo.png" 
              alt="Escape Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
        </Link>
      </div>

      <div className="relative z-20 max-w-6xl mx-auto pr-5 pl-[200px] md:pl-[220px] flex items-center min-h-[160px] justify-between w-full">

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-2 md:gap-3 flex-nowrap ml-auto">
          <Link 
            to="/bargain" 
            className={`${navButtonClass} font-medium`}
          >
            Bargain
          </Link>
          <Link 
            to="/your-bargains" 
            className={`${navButtonClass} font-medium`}
          >
            Your Bargains
          </Link>
          {isSignedIn && (
            <button
              onClick={handleBookingsClick}
              className={`${navButtonClass} font-medium`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Your Bookings
            </button>
          )}
          {/* Search */}
          <div className="relative inline-flex items-center">
            <button 
              onClick={toggleSearch}
              className={`${navButtonClass} font-medium`}
              aria-label="Search"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            {/* Sign Up button visible only when logged out */}
            {!isSignedIn && (
              <button
                onClick={() => setShowWelcome(true)}
                className={`${navButtonClass} font-medium ml-2`}
                aria-label="Sign Up"
              >
                Sign Up
              </button>
            )}
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
          
          {isSignedIn && (
            <div className="flex items-center gap-4">
              <span className="text-white">
                Welcome, {user?.firstName || user?.publicMetadata?.fullName || 'User'}!
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
          <button className={`${navButtonClass} ml-2 text-white text-base`}
          >
            🌐
          </button>
        </nav>
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          {isSignedIn && (
            <button
              onClick={handleBookingsClick}
              className={`${navButtonClass} font-medium text-sm px-4 h-10`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Bookings
            </button>
          )}
          <button className={`${navButtonClass} text-sm h-10 px-4`}>☰</button>
        </div>
      </div>
    </header>
    
    </>
  );
};

export default UserHeader;
