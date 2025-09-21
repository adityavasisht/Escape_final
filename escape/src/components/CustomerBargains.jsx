import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react'; // Add useAuth import

const CustomerBargains = () => {
  const { user } = useUser();
  const { getToken } = useAuth(); // Add getToken
  
  console.log('👤 DEBUG - Current user object:', user);
  console.log('👤 DEBUG - Current user ID:', user?.id);
  console.log('👤 DEBUG - Current user email:', user?.emailAddresses?.[0]?.emailAddress);
  
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        console.log('🔐 Getting authentication token...');
        
        // GET AUTHENTICATION TOKEN
        const token = await getToken();
        
        if (!token) {
          throw new Error('Failed to get authentication token. Please sign in again.');
        }
        
        console.log('✅ Token obtained, making request to:', `${API_BASE_URL}/api/trips/customer-bargains/${user.id}`);
        
        const response = await fetch(`${API_BASE_URL}/api/trips/customer-bargains/${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // CRITICAL: Add authentication header
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Response status:', response.status);

        // Handle different response statuses
        if (response.status === 401) {
          setError('Please sign in to view your bargain requests');
          return;
        }
        
        if (response.status === 403) {
          setError('Access denied: You can only view your own bargain requests');
          return;
        }
        
        if (response.status === 400) {
          const errorData = await response.json();
          setError(errorData.error || 'Invalid request');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Bargain requests data:', data);
        
        if (data.success) {
          setRequests(data.requests || []);
        } else {
          setError(data.error || 'Failed to fetch your bargain requests');
        }
        
      } catch (error) {
        console.error('❌ Error fetching customer bargains:', error);
        
        // Handle different types of errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          setError('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('authentication') || error.message.includes('token')) {
          setError('Authentication failed. Please sign out and sign in again.');
        } else {
          setError(error.message || 'Failed to fetch your bargain requests');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user?.id, API_BASE_URL, getToken]); // Add getToken to dependencies

  const handleCancelRequest = async (requestId) => {
    if (!user?.id) {
      alert('Please sign in to cancel requests');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this bargain request?')) {
      return;
    }

    try {
      console.log('🗑️ Cancelling bargain request:', requestId);
      
      // GET AUTHENTICATION TOKEN
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token. Please sign in again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/trips/cancel-bargain/${requestId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // CRITICAL: Add authentication header
        },
        body: JSON.stringify({ customerId: user.id })
      });

      console.log('📊 Cancel response status:', response.status);

      // Handle different response statuses
      if (response.status === 401) {
        alert('Authentication failed. Please sign in again.');
        return;
      }
      
      if (response.status === 403) {
        alert('Access denied. You can only cancel your own requests.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel request');
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove the cancelled request from the list
        setRequests(prevRequests => 
          prevRequests.filter(request => request._id !== requestId)
        );
        alert('✅ Bargain request cancelled successfully!');
      } else {
        throw new Error(data.error || 'Failed to cancel request');
      }
      
    } catch (error) {
      console.error('❌ Error cancelling bargain request:', error);
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        alert('❌ Authentication error. Please sign out and sign in again.');
      } else {
        alert(`❌ Failed to cancel request: ${error.message}`);
      }
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending':
        return {
          message: 'Request sent. Waiting for agency response.',
          color: 'bg-yellow-100 text-yellow-800',
          icon: '⏳'
        };
      case 'waiting_list':
        return {
          message: 'You have been put in the waiting list and the travel agency owner might call you if there would be available seats at the last moment.',
          color: 'bg-blue-100 text-blue-800',
          icon: '📋'
        };
      case 'rejected':
        return {
          message: 'Your bargain request was rejected by the agency owner.',
          color: 'bg-red-100 text-red-800',
          icon: '❌'
        };
      case 'cancelled':
        return {
          message: 'You cancelled this request.',
          color: 'bg-gray-100 text-gray-800',
          icon: '🚫'
        };
      default:
        return {
          message: 'Unknown status',
          color: 'bg-gray-100 text-gray-800',
          icon: '❓'
        };
    }
  };

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to sign in to view your bargain requests.</p>
          <a 
            href="/sign-in" 
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 inline-block"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 ml-4">Loading your bargain requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4 text-lg">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="font-semibold mb-2">Error Loading Requests</div>
              <div>{error}</div>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Bargain Requests</h1>
            <p className="text-gray-600 mt-2">
              Track the status of your custom travel deal requests
            </p>
            
            {/* Debug Info (remove in production) */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                👤 Signed in as: <strong>{user.firstName || 'User'}</strong> (ID: {user.id?.substring(0, 12)}...)
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">💼</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Bargain Requests Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any custom deal requests yet. Start by requesting a personalized travel deal!
            </p>
            <a
              href="/customer-bargain"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Request a Custom Deal
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map(request => {
              const statusInfo = getStatusMessage(request.status);
              
              return (
                <div key={request._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Request for: {request.tripId?.tripName || 'Trip Not Found'}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {request.destination}
                      </div>
                      <div className="text-sm text-gray-500">
                        Submitted: {new Date(request.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} mb-2`}>
                        {statusInfo.icon} {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Your Budget</div>
                      <div className="text-gray-700">₹{request.budget?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Travel Dates</div>
                      <div className="text-gray-700">
                        {new Date(request.startDate).toLocaleDateString('en-IN')} - {new Date(request.endDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Contact</div>
                      <div className="text-gray-700">{request.phoneNumber}</div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${statusInfo.color} mb-4`}>
                    <div className="font-medium mb-1">Status Update:</div>
                    <div className="text-sm">{statusInfo.message}</div>
                  </div>

                  {/* Show trip details if available */}
                  {request.tripId && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        <strong>Original Trip:</strong> {request.tripId.tripName}
                        {request.tripId.locations && ` - ${Array.isArray(request.tripId.locations) ? request.tripId.locations.join(', ') : request.tripId.locations}`}
                        {request.tripId.totalBudget && ` - ₹${request.tripId.totalBudget.toLocaleString()}`}
                      </p>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleCancelRequest(request._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerBargains;
