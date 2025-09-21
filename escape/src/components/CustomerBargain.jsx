import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react'; // Add useAuth import

const CustomerBargain = () => {
  const { user } = useUser();
  const { getToken } = useAuth(); // Add getToken
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [agencies, setAgencies] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Fetch agencies
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trips/agencies`);
        if (!response.ok) throw new Error('Failed to fetch agencies');
        const data = await response.json();
        setAgencies(data.agencies || []);
      } catch (error) {
        console.error('Error fetching agencies:', error);
      }
    };
    fetchAgencies();
  }, [API_BASE_URL]);

  // Fetch all trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trips/public`);
        if (!response.ok) throw new Error('Failed to fetch trips');
        const data = await response.json();
        setAllTrips(data.packages || []);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };
    fetchTrips();
  }, [API_BASE_URL]);

  // Filter trips when agency is selected
  useEffect(() => {
    if (selectedAgency && allTrips.length > 0) {
      const agency = agencies.find(a => a.id === selectedAgency);
      if (agency) {
        const filtered = allTrips.filter(trip => {
          return trip.agencyName === agency.name || 
                 trip.agencyId === agency.id ||
                 trip.adminId === agency.id;
        });
        setFilteredTrips(filtered);
      }
    } else {
      setFilteredTrips([]);
    }
    setSelectedTrip('');
  }, [selectedAgency, allTrips, agencies]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!selectedAgency || !selectedTrip) {
      alert('Please select both an agency and a trip');
      return;
    }

    if (!user) {
      alert('Please sign in to submit a bargain request');
      return;
    }

    if (!phoneNumber.trim()) {
      alert('Please enter your phone number');
      return;
    }

    if (!budget || parseFloat(budget) < 1000) {
      alert('Please enter a valid budget (minimum ₹1,000)');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (!destination.trim()) {
      alert('Please enter your preferred destination');
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      alert('Start date cannot be in the past');
      return;
    }

    if (end <= start) {
      alert('End date must be after start date');
      return;
    }

    setIsLoading(true);

    const agency = agencies.find(a => a.id === selectedAgency);

    if (!agency) {
      alert('Selected agency not found. Please try again.');
      setIsLoading(false);
      return;
    }

    const formData = {
      budget: parseFloat(budget),
      startDate,
      endDate,
      destination: destination.trim(),
      selectedAgencies: [agency.name],
      phoneNumber: phoneNumber.trim(),
      taggedTrip: selectedTrip,
      customerId: user.id,
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
      customerEmail: user.emailAddresses?.[0]?.emailAddress || ''
    };

    console.log('📤 Submitting bargain request:', formData);

    try {
      // GET AUTHENTICATION TOKEN
      console.log('🔐 Getting authentication token...');
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token. Please sign in again.');
      }

      console.log('✅ Token obtained, making request...');

      const response = await fetch(`${API_BASE_URL}/api/trips/customer-bargain`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // CRITICAL: Add authentication header
        },
        body: JSON.stringify(formData)
      });

      console.log('📊 Response status:', response.status);

      // Handle different response statuses
      if (response.status === 401) {
        alert('Authentication failed. Please sign out and sign in again.');
        return;
      }

      if (response.status === 403) {
        alert('Access denied. You can only create bargain requests for yourself.');
        return;
      }

      if (response.status === 400) {
        const errorData = await response.json();
        console.error('❌ Validation error:', errorData);
        
        if (errorData.details && Array.isArray(errorData.details)) {
          // Handle express-validator errors
          const errorMessages = errorData.details.map(detail => detail.msg).join('\n');
          alert(`Please fix the following errors:\n${errorMessages}`);
        } else {
          alert(errorData.error || 'Invalid request. Please check your inputs.');
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Bargain request submitted successfully:', result);
      
      alert('🎉 Bargain request submitted successfully!\n\nYou can check its status in "Your Bargains" section.');

      // Reset form
      setBudget('');
      setStartDate('');
      setEndDate('');
      setDestination('');
      setSelectedAgency('');
      setSelectedTrip('');
      setPhoneNumber('');
      setFilteredTrips([]);

    } catch (error) {
      console.error('❌ Error submitting bargain request:', error);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('❌ Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('authentication') || error.message.includes('token')) {
        alert('❌ Authentication error. Please sign out and sign in again.');
      } else {
        alert(`❌ Failed to submit bargain request: ${error.message}\n\nPlease try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to sign in to submit bargain requests.</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Request a Custom Deal</h1>
            <p className="text-lg text-gray-600">Tell us your preferences and get personalized travel deals</p>
            
            {/* User info */}
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                ✅ Signed in as <span className="font-medium">{user.firstName || 'User'}</span> 
                - Your request will be saved to "Your Bargains"
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-lg font-semibold text-gray-700 mb-3">
                Your Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
              <p className="text-sm text-gray-500 mt-2">We'll use this to contact you about deals</p>
            </div>

            {/* Agency Selection */}
            <div>
              <label htmlFor="selectedAgency" className="block text-lg font-semibold text-gray-700 mb-3">
                Select Travel Agency <span className="text-red-500">*</span>
              </label>
              <select
                id="selectedAgency"
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              >
                <option value="">Choose an agency</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Select the agency you want to get deals from ({agencies.length} agencies available)
              </p>
            </div>

            {/* Trip Selection */}
            <div>
              <label htmlFor="selectedTrip" className="block text-lg font-semibold text-gray-700 mb-3">
                Select Trip Package <span className="text-red-500">*</span>
              </label>
              <select
                id="selectedTrip"
                value={selectedTrip}
                onChange={(e) => setSelectedTrip(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
                disabled={!selectedAgency}
              >
                <option value="">
                  {!selectedAgency ? 'Select an agency first' : 'Choose a trip package'}
                </option>
                {filteredTrips.map((trip) => (
                  <option key={trip._id} value={trip._id}>
                    {trip.tripName} - {Array.isArray(trip.locations) ? trip.locations.join(', ') : trip.locations} - ₹{trip.totalBudget?.toLocaleString()}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                {filteredTrips.length > 0 
                  ? `${filteredTrips.length} packages available from selected agency`
                  : selectedAgency 
                    ? 'No packages available from this agency'
                    : 'Select an agency to see available packages'
                }
              </p>
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-lg font-semibold text-gray-700 mb-3">
                Your Budget <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">₹</span>
                <input
                  type="number"
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Enter your budget"
                  className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  min="1000"
                  step="1000"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Enter your total travel budget (minimum ₹1,000)</p>
            </div>

            {/* Travel Dates */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Travel Dates <span className="text-red-500">*</span>
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Select your preferred travel dates</p>
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block text-lg font-semibold text-gray-700 mb-3">
                Preferred Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where do you want to go?"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
              <p className="text-sm text-gray-500 mt-2">Enter your desired destination</p>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading || !selectedAgency || !selectedTrip}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                {isLoading ? 'Submitting...' : 
                 selectedAgency && selectedTrip ? 
                   `Submit Request to ${agencies.find(a => a.id === selectedAgency)?.name || 'Selected Agency'}` :
                   'Submit Bargain Request'
                }
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              <span className="font-semibold">💡 Tip:</span> You can track your request status in "Your Bargains" section!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerBargain;
