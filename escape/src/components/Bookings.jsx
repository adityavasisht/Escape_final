import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const Bookings = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // GET AUTHENTICATION TOKEN
        const token = await getToken();
        
        const response = await fetch(`${API_BASE_URL}/api/trips/bookings/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`, // ADD THIS HEADER
            'Content-Type': 'application/json'
          }
        });

        // Handle authentication errors
        if (response.status === 401) {
          setError('Please sign in to view your bookings');
          return;
        }
        
        if (response.status === 403) {
          setError('Access denied: You can only view your own bookings');
          return;
        }

        const data = await response.json();
        
        if (data.success) {
          setBookings(data.bookings);
        } else {
          setError(data.error || 'Failed to load bookings');
        }
      } catch (error) {
        setError('Error loading bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id, API_BASE_URL, getToken]); // Add getToken to dependencies

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <Link to="/" className="bg-purple-500 text-white px-6 py-3 rounded-lg">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Bookings</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No Bookings Yet</h2>
            <p className="text-gray-600 mb-6">You haven't made any bookings yet.</p>
            <Link 
              to="/"
              className="bg-purple-500 text-white px-6 py-3 rounded-lg"
            >
              Browse Trips
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.tripName || 'Trip Booking'}
                    </h3>
                    <p className="text-gray-600">Agency: {booking.agencyName}</p>
                    <p className="text-gray-600">
                      Booked on: {new Date(booking.bookingDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">Amount: ₹{booking.totalAmount?.toLocaleString()}</p>
                    <p className="text-gray-600">Phone: {booking.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono font-bold">
                      OTP: {booking.tripOTP}
                    </span>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        booking.bookingStatus === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : booking.bookingStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                    </div>
                  </div>
                </div>
                
                {booking.specialRequests && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>Special Requests:</strong> {booking.specialRequests}
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

export default Bookings;
