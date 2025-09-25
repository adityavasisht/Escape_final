import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { getCachedAdminStatus } from './utils/adminCheck';
import Bookings from './components/Bookings';

// Import both headers
import UserHeader from './components/UserHeader';
import AdminHeader from './components/AdminHeader';

// Import other components
import WelcomePopup from './components/WelcomePopup';
import Hero from './components/Hero';
import TopDeals from './components/TopDeals';
import TrendingDestinations from './components/TrendingDestinations';
import Footer from './components/Footer';
import Bargain from './components/Bargain';
import Cart from './components/Cart';
import SignUp from './components/SignUp';
import Login from './components/Login';
import AdminSignup from './components/AdminSignUp';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import TripDetails from './components/TripDetails';
import SearchResults from './components/SearchResults';
import ManageDeals from './components/ManageDeals';
import AdminTripBookings from './components/AdminTripBookings';
import CustomerBargain from './components/CustomerBargain';
import CustomerBargains from './components/CustomerBargains';

// Home page component - now public
const HomePage = () => (
  <>
    <Hero />
    <TopDeals/>
    <TrendingDestinations />
  </>
);

// Landing page removed in favor of always-on homepage
const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center w-full">
    <div className="max-w-4xl mx-auto px-5 py-16 text-center w-full">
      <div className="bg-white rounded-2xl shadow-xl p-12">
        <div className="w-25 h-25 flex items-center justify-center mx-auto mb-6">
          <img 
            src="/assets/logo.svg" 
            alt="Escape Logo" 
            className="w-24 h-24 object-contain" 
          />
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-teal-500">Escape</span>
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your trip, your budget, your call! <br />
         Where your Budget meets your dream Trip!
         Join Us!!
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-blue-50 rounded-xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">For Travelers</h3>
            <p className="text-gray-600 mb-4">
              Book smart, Travel better!
            </p>
            <div className="space-y-2">
              <a 
                href="/signup" 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold block transition-colors duration-200"
              >
                Join as Traveler
              </a>
              <a 
                href="/login" 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold block transition-colors duration-200"
              >
                Login
              </a>
            </div>
          </div>

          <div className="p-6 bg-emerald-50 rounded-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">For Agencies</h3>
            <p className="text-gray-600 mb-4">
              List Trips, Go Fast!
            </p>
            <div className="space-y-2">
              <a 
                href="/admin-signup" 
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold block transition-colors duration-200"
              >
                Join as Agency
              </a>
              <a 
                href="/admin-login" 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold block transition-colors duration-200"
              >
                Agency Login
              </a>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            {/* Add any additional content here */}
          </div>
          <div>
            {/* Add any additional content here */}
          </div>
          <div>
            {/* Add any additional content here */}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Protected Route component - redirect to home with signup flag
const ProtectedRoute = ({ children }) => {
  const { user, isLoaded } = useUser();

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If not signed in, send to home with signup flag
  if (!user) {
    return <Navigate to="/?signup=1" replace />;
  }

  return children;
};

// Admin Protected Route component - UPDATED TO REDIRECT TO LANDING
const AdminProtectedRoute = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [adminStatus, setAdminStatus] = useState({ isAdmin: false, agency: null });
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check admin status when component mounts
  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (isLoaded && isSignedIn && user) {
        setIsCheckingAdmin(true);

        try {
          const status = await getCachedAdminStatus(user);
          setAdminStatus(status);
          console.log('Admin check result:', status);
        } catch (error) {
          console.error('Admin verification failed:', error);

          // ENHANCED FALLBACK: Check multiple session storage sources
          const recentAdminSignup = sessionStorage.getItem('recentAdminSignup');
          const tempAdminData = sessionStorage.getItem('tempAdminData');
          const adminSignupEmail = sessionStorage.getItem('adminSignupEmail');

          console.log('🔍 Fallback check:', {
            recentAdminSignup,
            tempAdminData: !!tempAdminData,
            adminSignupEmail,
            currentUserEmail: user?.emailAddresses?.[0]?.emailAddress
          });

          // Check if this is a recent admin signup by user ID OR email match
          if (recentAdminSignup === user.id || 
              (adminSignupEmail && adminSignupEmail === user?.emailAddresses?.[0]?.emailAddress) ||
              tempAdminData) {
            
            console.log('🚀 Granting temporary admin access for recent signup');
            
            let agencyData = { 
              name: 'Your Travel Agency',
              ownerName: (user.firstName + ' ' + (user.lastName || '')).trim() || 'Agency Owner'
            };
            
            // Use stored admin data if available
            if (tempAdminData) {
              try {
                const parsedData = JSON.parse(tempAdminData);
                if (parsedData.agency) {
                  agencyData = parsedData.agency;
                }
              } catch (e) {
                console.log('⚠️ Error parsing temp admin data:', e);
              }
            }
            
            setAdminStatus({ 
              isAdmin: true, 
              agency: agencyData
            });
          } else {
            setAdminStatus({ isAdmin: false, agency: null });
          }
        } finally {
          setIsCheckingAdmin(false);
        }
      } else if (isLoaded) {
        setIsCheckingAdmin(false);
      }
    };

    verifyAdminAccess();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isLoaded ? 'Loading...' : 'Verifying admin access...'}
          </p>
        </div>
      </div>
    );
  }

  // REDIRECT TO LANDING PAGE instead of admin-login
  if (!isSignedIn) {
    return <Navigate to="/landing" replace />;
  }

  if (!adminStatus.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-4">You need to own an active travel agency to access this area.</p>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left text-sm">
              <div className="space-y-2">
                <div><strong>Your Email:</strong> {user?.emailAddresses?.[0]?.emailAddress}</div>
                <div><strong>Admin Status:</strong> 
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                    No Active Agency
                  </span>
                </div>
                <div><strong>To get admin access:</strong> Register your travel agency</div>
              </div>
            </div>

            <div className="space-y-3">
              <a 
                href="/admin-signup" 
                className="block bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Register Your Agency
              </a>
              <a 
                href="/landing" 
                className="block bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Back to Landing Page
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Inner component to access useLocation hook
const AppContent = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const location = useLocation();
  
  // State for admin status
  const { getToken } = useAuth();
  const [adminStatus, setAdminStatus] = useState({ isAdmin: false, agency: null });
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check admin status using your custom logic
  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (isLoaded && isSignedIn && user) {
        setIsCheckingAdmin(true);

        try {
          // UPDATED: Use authenticated admin check
          const status = await getCachedAdminStatus(user, getToken);
          setAdminStatus(status);
          console.log('Admin check result:', status);
        } catch (error) {
          console.error('Admin verification failed:', error);

          // ENHANCED FALLBACK: Check multiple session storage sources
          const recentAdminSignup = sessionStorage.getItem('recentAdminSignup');
          const tempAdminData = sessionStorage.getItem('tempAdminData');
          const adminSignupEmail = sessionStorage.getItem('adminSignupEmail');

          console.log('🔍 AppContent fallback check:', {
            recentAdminSignup,
            tempAdminData: !!tempAdminData,
            adminSignupEmail,
            currentUserEmail: user?.emailAddresses?.[0]?.emailAddress
          });

          // Check if this is a recent admin signup by user ID OR email match
          if (recentAdminSignup === user.id || 
              (adminSignupEmail && adminSignupEmail === user?.emailAddresses?.[0]?.emailAddress) ||
              tempAdminData) {
            
            console.log('🚀 Granting temporary admin access for recent signup in AppContent');
            
            let agencyData = { 
              name: 'Your Travel Agency',
              ownerName: (user.firstName + ' ' + (user.lastName || '')).trim() || 'Agency Owner'
            };
            
            // Use stored admin data if available
            if (tempAdminData) {
              try {
                const parsedData = JSON.parse(tempAdminData);
                if (parsedData.agency) {
                  agencyData = parsedData.agency;
                }
              } catch (e) {
                console.log('⚠️ Error parsing temp admin data in AppContent:', e);
              }
            }
            
            setAdminStatus({ 
              isAdmin: true, 
              agency: agencyData
            });
          } else {
            setAdminStatus({ isAdmin: false, agency: null });
          }
        } finally {
          setIsCheckingAdmin(false);
        }
      } else if (isLoaded) {
        setIsCheckingAdmin(false);
      }
    };

    verifyAdminAccess();
  }, [isLoaded, isSignedIn, user, getToken]);

  if (!isLoaded || (isSignedIn && isCheckingAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isLoaded ? 'Loading...' : 'Checking user privileges...'}
          </p>
        </div>
      </div>
    );
  }

  // Use the actual admin status from your system
  const isAdmin = adminStatus.isAdmin;
  
  console.log('🎯 Current user status:', {
    isSignedIn,
    isAdmin,
    userEmail: user?.emailAddresses?.[0]?.emailAddress,
    adminStatus
  });

  return (
    <div className="App">
      {/* Header always visible; admin header only when signed-in admin */}
      {isSignedIn && isAdmin ? <AdminHeader /> : <UserHeader />}

      {/* Main Routes */}
      <Routes>
        {/* ROOT ROUTE - Always public homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Protected user routes */}
        <Route path="/trip/:tripId" element={<TripDetails />} />

        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <SearchResults />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/bargain" 
          element={
            <ProtectedRoute>
              <Bargain />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/cart" 
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } 
        />

        {/* Customer bargain routes */}
        <Route 
          path="/customer-bargain" 
          element={
            <ProtectedRoute>
              <CustomerBargain />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/your-bargains" 
          element={
            <ProtectedRoute>
              <CustomerBargains />
            </ProtectedRoute>
          } 
        />

        {/* Bookings route */}
        <Route 
          path="/bookings" 
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          } 
        />

        {/* Admin protected routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/admin-bookings/:tripId" 
          element={
            <AdminProtectedRoute>
              <AdminTripBookings />
            </AdminProtectedRoute>
          } 
        />
        
        <Route 
          path="/manage-deals" 
          element={
            <AdminProtectedRoute>
              <ManageDeals />
            </AdminProtectedRoute>
          } 
        />

        {/* Public auth routes - always accessible */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Always show Footer except on admin pages when signed-in admin */}
      {!((isSignedIn && isAdmin) && location.pathname.startsWith('/admin')) && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
