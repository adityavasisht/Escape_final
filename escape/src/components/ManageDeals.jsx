import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

const ManageDeals = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Use owner ID (Clerk user ID) instead of agency ID
  const ownerId = user?.id;

  useEffect(() => {
    const fetchRequests = async () => {
      if (!ownerId) return;

      try {
        setIsLoading(true);
        setError('');
        
        // GET AUTHENTICATION TOKEN
        const token = await getToken();
        
        if (!token) {
          throw new Error('Failed to get authentication token');
        }
        
        console.log('📋 Fetching bargain requests for owner:', ownerId);
        
        // INCLUDE AUTHENTICATION TOKEN IN HEADERS
        const response = await fetch(`${API_BASE_URL}/api/trips/bargain/requests/owner/${ownerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📋 Bargain requests response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch requests (${response.status})`);
        }
        
        const data = await response.json();
        setRequests(data.requests || []);
        setAgencyName(data.agencyName || 'Your Agency');
        
        console.log('✅ Loaded', data.requests?.length || 0, 'bargain requests');
        
      } catch (error) {
        console.error('❌ Error fetching requests:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [ownerId, getToken]);

  // Handle status updates with authentication
  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      // GET AUTHENTICATION TOKEN
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/trips/bargain-status/${requestId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          status: newStatus,
          adminId: user?.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Update local state
      setRequests(requests.map(req => 
        req._id === requestId 
          ? { ...req, status: newStatus, updatedAt: new Date() }
          : req
      ));
      
      const statusMsg = newStatus === 'waiting_list' ? 'waiting list' : 'rejected';
      alert(`Request ${statusMsg} successfully!`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bargain requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Bargain Requests</h1>
            <p className="text-gray-600 mt-2">
              Requests for <span className="font-medium">{agencyName}</span>
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="text-2xl font-bold text-emerald-600">{requests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
        </div>
        
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Bargain Requests Yet</h3>
            <p className="text-gray-600">
              When customers submit bargain requests for your trips, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map(request => (
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
                      {request.tripId?.locations?.join(' → ') || request.destination}
                    </div>
                    {request.tripId?.totalBudget && (
                      <div className="text-sm text-gray-500">
                        Original Price: ₹{request.tripId.totalBudget.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(request.createdAt).toLocaleDateString('en-IN')}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : request.status === 'waiting_list'
                        ? 'bg-blue-100 text-blue-800'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status === 'waiting_list' ? 'Waiting List' : 
                       request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Customer Details</h4>
                    <p className="text-gray-700">
                      <span className="font-medium">Name:</span> {request.customerName || request.userName || 'Customer'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Email:</span> {request.customerEmail || 'Not provided'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Phone:</span> {request.phoneNumber}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Request Details</h4>
                    <p className="text-gray-700">
                      <span className="font-medium">Budget:</span> ₹{request.budget?.toLocaleString() || 'Not specified'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Destination:</span> {request.destination}
                    </p>
                    <div className={`mt-2 p-2 rounded-lg text-xs ${
                      request.budget < (request.tripId?.totalBudget || 0) 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {request.budget < (request.tripId?.totalBudget || 0) 
                        ? `₹${((request.tripId?.totalBudget || 0) - request.budget).toLocaleString()} below original price`
                        : 'Budget meets or exceeds original price'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Travel Dates</h4>
                    <p className="text-gray-700">
                      <span className="font-medium">Start:</span> {request.startDate ? new Date(request.startDate).toLocaleDateString('en-IN') : 'Not specified'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">End:</span> {request.endDate ? new Date(request.endDate).toLocaleDateString('en-IN') : 'Not specified'}
                    </p>
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">Duration:</span> {
                        request.startDate && request.endDate 
                          ? `${Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24))} days`
                          : 'Not calculated'
                      }
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Based on Status */}
                {request.status === 'pending' && (
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleStatusUpdate(request._id, 'waiting_list')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Put in Waiting List</span>
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(request._id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject</span>
                    </button>
                    <a 
                      href={`tel:${request.phoneNumber}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Call Customer</span>
                    </a>
                  </div>
                )}

                {/* Status Messages for Processed Requests */}
                {request.status === 'waiting_list' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium">Customer is in waiting list</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Customer has been notified and is waiting for available seats.
                    </p>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-medium">Request rejected</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      Customer has been notified about the rejection.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDeals;
