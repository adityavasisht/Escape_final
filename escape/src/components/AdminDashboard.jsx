import React, { useState, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import AddTripForm from './AddTripForm';
import TripList from './TripList';
import EditProfileModal from './EditProfileModal';

const AdminDashboard = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [showAddTripForm, setShowAddTripForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalBookings: 0,
    totalRevenue: 0,
    confirmedBookings: 0,
    totalCustomers: 0,
    activeCustomers: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [tripListKey, setTripListKey] = useState(0);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Add error states for better UX
  const [statsError, setStatsError] = useState('');
  const [bookingsError, setBookingsError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Debug current admin
  console.log('🔍 AdminDashboard - Current admin user ID:', user?.id);

  // UPDATED: Fetch admin-specific dashboard stats with authentication
  const fetchDashboardStats = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingStats(true);
      setStatsError('');
      console.log('🔍 Fetching dashboard stats for admin:', user.id);
      
      // GET AUTHENTICATION TOKEN
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token for stats');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Stats response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardStats(data.stats);
          console.log('✅ Dashboard stats loaded:', data.stats);
        } else {
          console.log('⚠️ Stats request unsuccessful:', data.error);
          setStatsError(data.error || 'Failed to load stats');
        }
      } else if (response.status === 401) {
        throw new Error('Authentication failed for stats. Please sign in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied for stats');
      } else {
        throw new Error(`Failed to load dashboard stats (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      setStatsError(error.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // CORRECTED: Handle bookings with proper URL structure
  const fetchBookings = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingBookings(true);
      setBookingsError('');
      console.log('📋 Fetching bookings for authenticated admin:', user.id);

      // GET AUTHENTICATION TOKEN
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token for bookings');
      }

      // CORRECTED ENDPOINT: Include adminId parameter to match backend route
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📋 Bookings response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookings(data.bookings || []);
          console.log('✅ Bookings loaded successfully:', data.bookings?.length || 0);
        } else {
          console.log('⚠️ Bookings request unsuccessful:', data.error);
          setBookings([]);
        }
      } else if (response.status === 401) {
        throw new Error('Authentication failed for bookings. Please sign in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied for bookings');
      } else if (response.status === 404) {
        console.log('📋 No bookings found for this admin');
        setBookings([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load bookings (${response.status})`);
      }

    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setBookingsError(error.message);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // CORRECTED: Handle booking stats with proper URL structure
  const fetchBookingStats = async () => {
    if (!user?.id) return;

    try {
      console.log('📊 Fetching booking stats for authenticated admin:', user.id);

      // GET AUTHENTICATION TOKEN
      const token = await getToken();
      
      if (!token) {
        console.error('❌ Failed to get authentication token for booking stats');
        return;
      }

      // CORRECTED ENDPOINT: Include adminId parameter to match backend route
      const response = await fetch(`${API_BASE_URL}/api/admin/booking-stats/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Booking stats response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookingStats(data.stats || {});
          console.log('✅ Booking stats loaded successfully:', data.stats);
        } else {
          console.log('⚠️ Booking stats request unsuccessful:', data.error);
          setBookingStats({
            totalBookings: 0,
            confirmedBookings: 0,
            totalRevenue: 0,
            recentBookings: []
          });
        }
      } else if (response.status === 401) {
        console.error('❌ Authentication failed for booking stats');
      } else if (response.status === 403) {
        console.error('❌ Access denied for booking stats');
      } else if (response.status === 404) {
        console.log('📊 No booking stats found for this admin');
        setBookingStats({
          totalBookings: 0,
          confirmedBookings: 0,
          totalRevenue: 0,
          recentBookings: []
        });
      } else {
        console.error('❌ Failed to load booking stats:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching booking stats:', error);
    }
  };

  // Fetch stats when component mounts or user changes
  useEffect(() => {
    if (user?.id && isLoaded) {
      fetchDashboardStats();
      fetchBookings();
    }
  }, [user?.id, isLoaded]);

  // Update booking stats when bookings change
  useEffect(() => {
    if (bookings.length >= 0) { // Include 0 to handle empty array
      fetchBookingStats();
    }
  }, [bookings]);

  const handleAddTrip = (newTrip) => {
    console.log('New trip added by admin:', user?.id, newTrip);
    // Refresh the trip list and dashboard stats
    setTripListKey(prev => prev + 1);
    fetchDashboardStats();
    fetchBookings();
  };

  const handleEditTrip = (trip) => {
    console.log('Edit trip:', trip._id, 'by admin:', user?.id);
    setEditingTrip(trip);
    setShowAddTripForm(true);
  };

  const handleDeleteTrip = (tripId) => {
    console.log('Delete trip:', tripId, 'by admin:', user?.id);
    // Refresh dashboard stats after deletion
    fetchDashboardStats();
    fetchBookings();
  };

  const handleManageDeals = () => {
    navigate('/manage-deals');
  };

  const handleProfileSave = (updatedAgency) => {
    console.log('Profile updated by admin:', user?.id, updatedAgency);
  };

  // Handle view bookings - switch to bookings tab
  const handleViewBookings = () => {
    setActiveTab('bookings');
    fetchBookings(); // Refresh bookings when switching to tab
  };

  const closeAddTripForm = () => {
    setShowAddTripForm(false);
    setEditingTrip(null);
    // Refresh trip list when form is closed (in case of updates)
    setTripListKey(prev => prev + 1);
    // Also refresh stats
    fetchDashboardStats();
    fetchBookings();
  };

  // UPDATED: Refresh all data function with authentication
  const handleRefreshAll = async () => {
    if (!user?.id) return;
    
    console.log('🔄 Refreshing all dashboard data...');
    await Promise.all([
      fetchDashboardStats(),
      fetchBookings()
    ]);
    
    // Also refresh trip list
    setTripListKey(prev => prev + 1);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading secure admin dashboard...</p>
          <p className="text-xs text-gray-500 mt-2">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                🎉 Secure Admin Dashboard Active!
              </p>
              <p className="text-xs text-green-700">
                Your agency dashboard is protected with end-to-end authentication. Only you can see your data.
              </p>
            </div>
          </div>
        </div>

        {/* Error Banner for Stats */}
        {statsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Dashboard Stats Error</p>
                <p className="text-xs text-red-700">{statsError}</p>
              </div>
              <button
                onClick={() => {
                  setStatsError('');
                  fetchDashboardStats();
                }}
                className="ml-auto text-red-600 hover:text-red-800 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.firstName || 'Admin'}!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Manage your travel packages and bookings securely
              </p>
              
              {/* Admin Status Badge */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Authenticated Admin
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🔒 Data Isolated
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👤 {user?.id?.slice(-8) || 'Unknown'}
                </span>
                {(isLoadingStats || isLoadingBookings) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefreshAll}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-2"
                disabled={isLoadingStats || isLoadingBookings}
              >
                {(isLoadingStats || isLoadingBookings) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
              <Link 
                to="/"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Visit Site
              </Link>
              <UserButton afterSignOutUrl="/landing" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('trips')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'trips'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Trips
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* CORRECTED: Stats Cards - Use dashboardStats for all values */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Packages</p>
                    <div className="text-2xl font-bold text-gray-900">
                      {isLoadingStats ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                      ) : (
                        <span>{dashboardStats.totalTrips}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {dashboardStats.activeTrips} active
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <div className="text-2xl font-bold text-gray-900">
                      {isLoadingStats ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                      ) : (
                        <span>{dashboardStats.totalBookings || 0}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {dashboardStats.confirmedBookings || 0} confirmed
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <div className="text-2xl font-bold text-gray-900">
                      {isLoadingStats ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                      ) : (
                        <span>₹{(dashboardStats.totalRevenue || 0).toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {dashboardStats.totalRevenue === 0 ? 'Launch your first trip!' : 'Total earned'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                    <div className="text-2xl font-bold text-gray-900">
                      <span>{dashboardStats.totalCustomers || 0}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {dashboardStats.activeCustomers || 0} active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowAddTripForm(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add New Package</span>
                </button>
                <button 
                  onClick={handleViewBookings}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>View Bookings</span>
                </button>
                <button 
                  onClick={handleManageDeals}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Manage Deals</span>
                </button>
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Admin-Specific Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    🔒 Secure Admin Dashboard
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    All data is filtered by your admin ID. You can only see and manage travel packages and bookings created by your agency. Complete data isolation is active.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bookings Tab Content */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* CORRECTED: Booking Statistics - Use dashboardStats for consistency */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-emerald-600">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                  ) : dashboardStats.totalBookings || 0}
                </div>
                <div className="text-gray-600">Total Bookings</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardStats.confirmedBookings || 0}
                </div>
                <div className="text-gray-600">Confirmed</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">
                  ₹{(dashboardStats.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="text-gray-600">Total Revenue</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardStats.totalCustomers || 0}
                </div>
                <div className="text-gray-600">Total Customers</div>
              </div>
            </div>

            {/* Error Banner for Bookings */}
            {bookingsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Bookings Error</p>
                    <p className="text-xs text-red-700">{bookingsError}</p>
                  </div>
                  <button
                    onClick={() => {
                      setBookingsError('');
                      fetchBookings();
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Customer Bookings</h3>
                <button
                  onClick={fetchBookings}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  disabled={isLoadingBookings}
                >
                  {isLoadingBookings ? '🔄 Loading...' : '🔄 Refresh'}
                </button>
              </div>
              
              {isLoadingBookings ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="mb-4">When customers book your trips, they'll appear here with their OTPs.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      📋 <strong>Ready for Bookings!</strong> Your booking system is now active and connected.
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Create attractive trip packages to start receiving customer bookings with automatic OTP generation.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAddTripForm(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create Your First Trip
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trip & OTP
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.tripName}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono font-bold">
                                  OTP: {booking.tripOTP}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(booking.tripOTP);
                                    // Could add a toast notification here
                                  }}
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                  title="Copy OTP"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.customerName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.customerEmail}</div>
                            <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{booking.totalAmount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.bookingStatus === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : booking.bookingStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.bookingStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Bookings Preview - Use bookingStats for recent activity */}
            {bookingStats.recentBookings && bookingStats.recentBookings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {bookingStats.recentBookings.slice(0, 5).map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                          <div className="text-xs text-gray-500">
                            {booking.tripName} • OTP: {booking.tripOTP}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">₹{booking.amount?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trips Tab Content - Pass getToken to TripList */}
        {activeTab === 'trips' && (
          <TripList 
            key={tripListKey}
            onEdit={handleEditTrip} 
            onDelete={handleDeleteTrip}
            showAllTrips={true}
            getToken={getToken}
          />
        )}

        {/* Modals */}
        {showAddTripForm && (
          <AddTripForm
            trip={editingTrip}
            onClose={closeAddTripForm}
            onSubmit={handleAddTrip}
          />
        )}

        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={handleProfileSave}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
