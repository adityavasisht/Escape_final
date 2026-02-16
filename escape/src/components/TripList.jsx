import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react'; 

const TripList = ({ onEdit, onDelete, showAllTrips = false, getToken: propGetToken }) => {
  const { user } = useUser();
  const { getToken: hookGetToken } = useAuth();
  
  // Use prop getToken if provided, otherwise use hook
  const getToken = propGetToken || hookGetToken;
  
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // NEW: State for loading percentage
  const [loadingPercentage, setLoadingPercentage] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // NEW: Effect to simulate loading progress
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingPercentage(10); // Start at 10%
      interval = setInterval(() => {
        setLoadingPercentage(prev => {
          // Slow down progress as it gets higher to "wait" for the actual fetch
          if (prev >= 90) return 90;
          const increment = prev > 60 ? 2 : 5; // Go fast initially, then slow
          return prev + increment;
        });
      }, 200);
    } else {
      setLoadingPercentage(100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const fetchTrips = async () => {
      console.log('🔍 TripList - Starting fetch for user:', user?.id);
      
      if (!user?.id) {
        console.log('❌ TripList - No user ID available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        console.log('🔐 TripList - Getting authentication token...');
        
        const token = await getToken();
        
        if (!token) {
          throw new Error('Failed to get authentication token. Please sign in again.');
        }

        console.log('✅ TripList - Token obtained, fetching trips for admin:', user.id);
        
        const adminUrl = `${API_BASE_URL}/api/admin/trips`;
        console.log('📡 TripList - Calling authenticated URL:', adminUrl);
        
        const response = await fetch(adminUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 TripList - Response status:', response.status);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You can only view your own trips.');
        } else if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 TripList - Response data:', data);
        
        if (data.success && data.trips) {
          console.log('✅ TripList - Found trips:', data.trips.length);
          setTrips(data.trips);
          setError('');
          
          if (data.trips.length === 0) {
            console.log('⚠️ TripList - No trips found for admin:', user.id);
          }
        } else {
          console.log('❌ TripList - Response not successful:', data);
          throw new Error(data.error || 'Failed to fetch trips');
        }

      } catch (error) {
        console.error('❌ TripList - Error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          setError('Network error. Please check your internet connection.');
        } else if (error.message.includes('authentication') || error.message.includes('token')) {
          setError('Authentication error. Please sign out and sign in again.');
        } else {
          setError(error.message || 'Failed to load trips');
        }
        setTrips([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [user?.id, API_BASE_URL, getToken]);

  const handleDelete = async (tripId) => {
    try {
      console.log('🗑️ Deleting trip:', tripId);
      
      const token = await getToken();
      
      if (!token) {
        alert('Authentication failed. Please sign in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        alert('Authentication failed. Please sign in again.');
        return;
      } else if (response.status === 403) {
        alert('Access denied. You can only delete your own trips.');
        return;
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete trip');
      }

      const result = await response.json();
      
      if (result.success) {
        setTrips(prevTrips => prevTrips.filter(trip => trip._id !== tripId));
        if (onDelete) onDelete(tripId);
        console.log('✅ Trip deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      alert(`Failed to delete trip: ${error.message}`);
    }
  };

  console.log('🔍 TripList - Render state:', {
    isLoading,
    error,
    tripsCount: trips.length,
    userId: user?.id
  });

  // UPDATED: Loading State with Buffering Wheel and Percentage
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        {/* Buffering Wheel Container */}
        <div className="relative w-24 h-24 mb-6">
          {/* Background Circle */}
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          
          {/* Spinning Foreground Circle */}
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
          
          {/* Percentage Text in Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-emerald-600">{loadingPercentage}%</span>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading trips...</h3>
        <p className="text-gray-500 max-w-sm mx-auto mb-6">
          Fetching your travel packages from the database. Please wait a moment.
        </p>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-xs w-full">
          <p className="text-sm text-blue-800 font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Establishing Secure Connection
          </p>
          <p className="text-xs text-blue-600 mt-1">Admin ID: {user?.id?.slice(-8) || '...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Trips</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">
          <div><strong>Debug Info:</strong></div>
          <div>Admin ID: {user?.id?.slice(-8) || 'Unknown'}</div>
          <div>Authentication: {error.includes('authentication') ? 'Failed' : 'Unknown'}</div>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
          {error.includes('authentication') && (
            <button
              onClick={() => {
                window.location.href = '/admin-login';
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Sign In Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
        <p className="text-gray-600 mb-4">You haven't created any travel packages yet.</p>
        <div className="text-sm text-gray-500 bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">Secure Data Loaded</span>
          </div>
          <div className="text-green-700">Admin ID: {user?.id?.slice(-8) || 'Unknown'}</div>
          <div className="text-green-700">Authentication: ✅ Verified</div>
          <div className="text-green-700">Data Isolation: ✅ Active</div>
        </div>
        <button
          onClick={() => {
            console.log('🔄 Manual refresh clicked');
            window.location.reload();
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Travel Packages</h2>
            <p className="text-sm text-gray-600">Secure admin-only view with data isolation</p>
          </div>
          <div className="text-right">
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
              {trips.length} package{trips.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center mt-1">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-green-600">Authenticated</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trip Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bookings
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trip OTP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                View Bookings
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips.map((trip) => (
              <tr key={trip._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{trip.tripName}</div>
                    <div className="text-sm text-gray-500">
                      {Array.isArray(trip.locations) ? trip.locations.join(', ') : trip.locations}
                    </div>
                    {trip.departureDateTime && (
                      <div className="text-xs text-gray-400">
                        Departure: {new Date(trip.departureDateTime).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{trip.totalBudget?.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {trip.currentBookings || 0} / {trip.maxCapacity}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-emerald-600 h-1.5 rounded-full" 
                      style={{ width: `${((trip.currentBookings || 0) / trip.maxCapacity) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trip.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trip.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono font-bold">
                      {trip.tripOTP || 'N/A'}
                    </span>
                    {trip.tripOTP && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(trip.tripOTP);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title="Copy OTP"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(trip)}
                    className="text-emerald-600 hover:text-emerald-900 font-medium"
                    title="Edit trip"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${trip.tripName}"?\n\nThis action cannot be undone.`)) {
                        handleDelete(trip._id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900 font-medium"
                    title="Delete trip"
                  >
                    Delete
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a
                    href={`/admin-bookings/${trip._id}`}
                    className="text-blue-600 hover:text-blue-900"
                    title="View bookings for this trip"
                  >
                    View Bookings
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure data with end-to-end authentication
          </div>
          <div>
            Admin: {user?.id?.slice(-8) || 'Unknown'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripList;
