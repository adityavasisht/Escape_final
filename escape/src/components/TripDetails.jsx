import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react'; // Add useAuth

const TripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const { user } = useUser();
  const { getToken } = useAuth(); // Add getToken for authentication
  const [agencyDetails, setAgencyDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBooking, setIsBooking] = useState(false); // Add booking state

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // MAIN: Fetch trip data - This endpoint is public so no auth needed
  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!tripId) {
        setError('No trip ID provided');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 TripDetails - Loading trip ID:', tripId);
        setIsLoading(true);
        setError('');
        
        console.log('📡 Fetching trip details from:', `${API_BASE_URL}/api/trips/public/${tripId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/trips/public/${tripId}`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trip details (${response.status})`);
        }
        
        const data = await response.json();
        console.log('📊 Trip data received:', data);
        
        if (data.success && data.trip) {
          setTrip(data.trip);
          console.log('✅ Trip loaded:', data.trip.tripName);
        } else {
          throw new Error(data.error || 'Failed to load trip details');
        }
      } catch (error) {
        console.error('❌ Error fetching trip details:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, API_BASE_URL]);

  // Fetch agency details when trip data is loaded - This endpoint is also public
  useEffect(() => {
    const fetchAgencyDetails = async () => {
      if (!trip?.agencyName || trip.agencyName === 'Travel Agency') {
        setAgencyDetails({
          name: trip?.agencyName || 'Travel Agency',
          ownerName: 'Agency Owner',
          contactEmail: 'info@travelagency.com',
          contactPhone: '+91 9999999999',
          description: 'Professional travel services'
        });
        return;
      }

      try {
        console.log('🏢 Fetching agency details for:', trip.agencyName);
        
        const response = await fetch(`${API_BASE_URL}/api/trips/agency-details/${encodeURIComponent(trip.agencyName)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.agency) {
            setAgencyDetails({
              name: data.agency.name,
              ownerName: data.agency.ownerName,
              contactEmail: data.agency.contactEmail,
              contactPhone: data.agency.contactPhone,
              description: data.agency.description || 'Professional travel services'
            });
            console.log('✅ Agency details loaded:', data.agency.name);
          } else {
            throw new Error('Agency data not found');
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch agency details, using defaults:', error.message);
        
        setAgencyDetails({
          name: trip?.agencyName || 'Travel Agency',
          ownerName: 'Agency Owner',
          contactEmail: 'info@travelagency.com',
          contactPhone: '+91 9999999999',
          description: 'Professional travel services'
        });
      }
    };

    if (trip) {
      fetchAgencyDetails();
    }
  }, [trip, API_BASE_URL]);

  // Handle bargain button click with pre-selection
  const handleBargainClick = () => {
    console.log('🎯 Bargain button clicked for trip:', trip.tripName);
    
    // Navigate to bargain page with pre-selected data
    navigate('/bargain', {
      state: {
        preSelectedTrip: trip,
        preSelectedAgency: {
          id: trip.agencyId || 'unknown',
          name: trip.agencyName || 'Unknown Agency'
        }
      }
    });
  };

  // UPDATED: Handle book now with authentication
  const handleBookNow = async () => {
    if (!user) {
      alert('Please sign in to book this trip');
      return;
    }

    // Get user details
    const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
    const customerEmail = user.emailAddresses?.[0]?.emailAddress || '';
    
    // Get phone number from user (you might want to add a form for this)
    const customerPhone = prompt('Please enter your phone number:');
    if (!customerPhone) {
      alert('Phone number is required for booking');
      return;
    }

    const specialRequests = prompt('Any special requests? (Optional)') || '';

    const bookingData = {
      tripId: trip._id,
      customerId: user.id,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests
    };

    setIsBooking(true); // Set loading state

    try {
      console.log('📝 Booking trip:', trip.tripName);
      
      // GET AUTHENTICATION TOKEN
      console.log('🔐 Getting authentication token for booking...');
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token. Please sign in again.');
      }

      console.log('✅ Token obtained, making booking request...');
      
      const response = await fetch(`${API_BASE_URL}/api/trips/book-trip`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // CRITICAL: Add authentication header
        },
        body: JSON.stringify(bookingData)
      });

      console.log('📊 Booking response status:', response.status);

      // Handle different response statuses
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      } else if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid booking data. Please try again.');
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Booking failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Booking successful:', result.booking);
        
        alert(`🎉 Success! Your trip "${result.booking.tripName}" has been booked!\n\n` +
              `Your OTP is: ${result.booking.tripOTP}\n\n` +
              `Please save this OTP - you'll need it for your trip.\n` +
              `Booking Date: ${new Date(result.booking.bookingDate).toLocaleDateString()}\n` +
              `Total Amount: ₹${result.booking.totalAmount.toLocaleString()}\n\n` +
              `A confirmation email has been sent to: ${customerEmail}`);
        
        // Optionally refresh trip data to update booking count
        window.location.reload();
      } else {
        throw new Error(result.error || 'Booking failed');
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('❌ Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('authentication') || error.message.includes('token')) {
        alert('❌ Authentication error. Please sign out and sign in again.');
      } else {
        alert(`❌ Booking failed: ${error.message}`);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleAddToCart = () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

    const existingItem = cartItems.find(item => item._id === trip._id);
    if (!existingItem) {
      cartItems.push({
        _id: trip._id,
        tripName: trip.tripName,
        totalBudget: trip.totalBudget,
        locations: trip.locations,
        image: trip.itineraryImages?.[0]?.url || null,
        quantity: 1
      });
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      alert('Trip added to cart!');
    } else {
      alert('Trip is already in cart!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <span className="text-gray-600">Loading trip details...</span>
          <p className="text-sm text-gray-500 mt-2">Trip ID: {tripId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Trip</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trip not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Hero Image Section */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-5">
          {trip.itineraryImages && trip.itineraryImages.length > 0 ? (
            <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden">
              <img
                src={trip.itineraryImages[currentImageIndex]?.url}
                alt={trip.tripName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

              {/* Image Navigation */}
              {trip.itineraryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? trip.itineraryImages.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === trip.itineraryImages.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Trip Title Overlay with Agency Info */}
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{trip.tripName}</h1>
                <p className="text-lg opacity-90 mb-2">
                  📍 {trip.locations?.join(' → ') || 'Multiple destinations'}
                </p>
                {trip.agencyName && (
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium">Organized by {trip.agencyName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-96 md:h-[500px] bg-gradient-to-r from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{trip.tripName}</h1>
                <p className="text-lg opacity-90 mb-2">
                  📍 {trip.locations?.join(' → ') || 'Multiple destinations'}
                </p>
                {trip.agencyName && (
                  <div className="flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium">Organized by {trip.agencyName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trip Details Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2">
              {/* Enhanced Agency Information Section */}
              {(trip.agencyName || agencyDetails) && (
                <div className="bg-white rounded-xl p-8 shadow-lg mb-8 border-l-4 border-emerald-500">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 mr-3">
                          {trip.agencyName}
                        </h2>
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded-full">
                          Verified Agency
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">Travel Agency & Tour Operator</p>

                      {agencyDetails && (
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          {agencyDetails.contactEmail && (
                            <div className="flex items-center text-gray-600">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                              {agencyDetails.contactEmail}
                            </div>
                          )}
                          {agencyDetails.contactPhone && (
                            <div className="flex items-center text-gray-600">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {agencyDetails.contactPhone}
                            </div>
                          )}
                        </div>
                      )}

                      {agencyDetails?.description && (
                        <p className="text-gray-700 mt-4 leading-relaxed">
                          {agencyDetails.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Licensed & Insured
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          24/7 Support
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Customer Satisfaction
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trip Overview */}
              <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Overview</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Duration & Transport</h3>
                    <div className="space-y-2 text-gray-600">
                      {trip.departureDateTime && (
                        <p>🛫 Departure: {new Date(trip.departureDateTime).toLocaleDateString()}</p>
                      )}
                      {trip.arrivalDateTime && (
                        <p>🛬 Return: {new Date(trip.arrivalDateTime).toLocaleDateString()}</p>
                      )}
                      {trip.transportMedium && (
                        <p>🚌 Transport: {trip.transportMedium}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Locations & Capacity</h3>
                    <div className="space-y-2 text-gray-600">
                      {trip.departureLocation && (
                        <p>📍 From: {trip.departureLocation}</p>
                      )}
                      {trip.arrivalLocation && (
                        <p>📍 To: {trip.arrivalLocation}</p>
                      )}
                      <p>👥 Max Capacity: {trip.maxCapacity} people</p>
                      <p>📊 Current Bookings: {trip.currentBookings || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {trip.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{trip.description}</p>
                  </div>
                )}

                {/* Inclusions & Exclusions */}
                <div className="grid md:grid-cols-2 gap-6">
                  {trip.inclusions && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-green-700">✅ Inclusions</h3>
                      <p className="text-gray-700 leading-relaxed">{trip.inclusions}</p>
                    </div>
                  )}

                  {trip.exclusions && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-red-700">❌ Exclusions</h3>
                      <p className="text-gray-700 leading-relaxed">{trip.exclusions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Itinerary Images */}
              {trip.itineraryImages && trip.itineraryImages.length > 1 && (
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Itinerary</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {trip.itineraryImages.map((image, index) => (
                      <div
                        key={`${trip._id}-img-${index}`}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={image.url}
                          alt={image.originalName || `${trip.tripName} image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors"></div>
                        {index === currentImageIndex && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-lg sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    ₹{trip.totalBudget?.toLocaleString()}
                  </div>
                  <p className="text-gray-600">per person</p>
                </div>

                {/* Rating & Reviews */}
                <div className="flex justify-center items-center mb-6 space-x-4">
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">⭐</span>
                    <span className="font-medium">{trip.averageRating?.toFixed(1) || 'New'}</span>
                  </div>
                  <div className="text-gray-600">
                    ({trip.totalReviews || 0} reviews)
                  </div>
                </div>

                {/* Enhanced Agency Info in Sidebar */}
                {trip.agencyName && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Organized by</p>
                        <p className="font-bold text-gray-800">{trip.agencyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified Travel Partner
                    </div>
                  </div>
                )}

                {/* Authentication Status for User */}
                {user && (
                  <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800">Ready to Book</p>
                        <p className="text-xs text-green-700">
                          Signed in as {user.firstName || 'User'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleBookNow}
                    disabled={isBooking}
                    className="w-full btn-outline-light rounded-md font-bold text-lg flex items-center justify-center"
                  >
                    {isBooking ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Book Now'
                    )}
                  </button>

                  <button
                    onClick={handleBargainClick}
                    disabled={isBooking}
                    className="w-full btn-outline-light rounded-md font-medium flex items-center justify-center"
                  >
                    Request Custom Deal
                  </button>
                </div>

                {/* Availability */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {trip.maxCapacity - (trip.currentBookings || 0)} spots remaining
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full" 
                      style={{ width: `${((trip.currentBookings || 0) / trip.maxCapacity) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((trip.currentBookings || 0) / trip.maxCapacity * 100).toFixed(0)}% booked
                  </p>
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-xs font-medium text-blue-800">Secure Booking</p>
                      <p className="text-xs text-blue-700">
                        All bookings are processed with secure authentication and data encryption.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TripDetails;
