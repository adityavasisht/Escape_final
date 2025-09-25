import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';


const Bargain = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  
  const navigate = useNavigate();
  
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passengers, setPassengers] = useState([{ gender: 'Other', age: '' }]);

  const [agencies, setAgencies] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Get pre-selected data from navigation state
  const preSelectedTrip = location.state?.preSelectedTrip;
  const preSelectedAgency = location.state?.preSelectedAgency;

  // Track if agency is pre-filled
  const [isAgencyPreFilled, setIsAgencyPreFilled] = useState(false);

  console.log('🎯 Pre-selected data:', { preSelectedTrip, preSelectedAgency });

  // Fetch agencies
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        console.log('📡 Fetching agencies...');
        const response = await fetch(`${API_BASE_URL}/api/trips/agencies`);
        if (!response.ok) throw new Error('Failed to fetch agencies');
        const data = await response.json();
        
        console.log('✅ Agencies loaded:', data.agencies?.length || 0);
        setAgencies(data.agencies || []);
      } catch (error) {
        console.error('❌ Error fetching agencies:', error);
        setAgencies([]);
      }
    };
    fetchAgencies();
  }, [API_BASE_URL]);

  // Fetch all trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        console.log('📡 Fetching all trips...');
        const response = await fetch(`${API_BASE_URL}/api/trips/public`);
        if (!response.ok) throw new Error('Failed to fetch trips');
        const data = await response.json();
        
        console.log('✅ All trips loaded:', data.packages?.length || 0);
        setAllTrips(data.packages || []);
      } catch (error) {
        console.error('❌ Error fetching trips:', error);
        setAllTrips([]);
      }
    };
    fetchTrips();
  }, [API_BASE_URL]);

  // SIMPLIFIED: Only pre-select agency when data is available
  useEffect(() => {
    if (preSelectedAgency && agencies.length > 0 && !isAgencyPreFilled) {
      console.log('🎯 Pre-selecting agency:', preSelectedAgency.name);

      // Find the agency by name
      const foundAgency = agencies.find(agency => agency.name === preSelectedAgency.name);
      
      if (foundAgency) {
        console.log('✅ Found matching agency:', foundAgency.name, foundAgency.id);
        setSelectedAgency(foundAgency.id);
        setIsAgencyPreFilled(true);
        
        // Pre-fill destination if available
        if (preSelectedTrip?.locations) {
          const destination = Array.isArray(preSelectedTrip.locations) 
            ? preSelectedTrip.locations.join(', ')
            : preSelectedTrip.locations;
          setDestination(destination);
          console.log('✅ Pre-filled destination:', destination);
        }
        
        console.log('🎉 Agency pre-selection completed!');
      } else {
        console.log('❌ Agency not found in agencies list');
      }
    }
  }, [preSelectedAgency, agencies, isAgencyPreFilled, preSelectedTrip]);

  // Filter trips based on selected agency
  useEffect(() => {
    console.log('🔍 Filtering trips...');
    console.log('Selected agency ID:', selectedAgency);
    console.log('Total trips available:', allTrips.length);
    
    if (selectedAgency && allTrips.length > 0 && agencies.length > 0) {
      const agency = agencies.find(a => a.id === selectedAgency);
      console.log('🏢 Selected agency object:', agency);
      
      if (agency) {
        console.log('🔍 Looking for trips with agencyName:', agency.name);
        
        const filtered = allTrips.filter(trip => {
          const tripAgencyName = trip.agencyName || trip.agencyId || '';
          const matches = tripAgencyName === agency.name || 
                         tripAgencyName === agency.id ||
                         trip.adminId === agency.id;
          
          console.log(`Trip "${trip.tripName}": agencyName="${tripAgencyName}", matches=${matches}`);
          return matches;
        });
        
        console.log(`✅ Filtered trips: ${filtered.length} trips found for agency "${agency.name}"`);
        setFilteredTrips(filtered);
        
        if (filtered.length > 0) {
          console.log('🎯 Available trips:', filtered.map(t => t.tripName));
        }
      }
    } else if (selectedAgency === '') {
      console.log('🔄 Clearing filtered trips (no agency selected)');
      setFilteredTrips([]);
    }
    
    // Reset selected trip when agency changes
    if (selectedTrip && filteredTrips.length === 0) {
      setSelectedTrip('');
    }
  }, [selectedAgency, allTrips, agencies]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation checks
  if (!selectedAgency || !selectedTrip) {
    alert('Please select both an agency and a trip');
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

  const agency = agencies.find(a => a.id === selectedAgency);

  if (!agency) {
    alert('Selected agency not found. Please try again.');
    return;
  }

  // Prepare form data
  const formData = {
    budget: parseFloat(budget),
    startDate,
    endDate,
    destination: destination.trim(),
    selectedAgencies: [agency.name],
    phoneNumber: phoneNumber.trim(),
    taggedTrip: selectedTrip,
    customerId: user?.id || 'guest-' + Date.now(),
    customerName: user 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer'
      : 'Guest Customer',
    customerEmail: user?.emailAddresses?.[0]?.emailAddress || 'guest@example.com',
    passengers: passengers.map(p => ({ gender: p.gender, age: p.age ? Number(p.age) : undefined })),
    totalPassengers: passengers.length
  };

  console.log('📤 Submitting bargain request:', formData);

  // Show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  try {
    let token = null;
    
    // Get authentication token if user is signed in
    if (user) {
      try {
        token = await getToken();
        console.log('✅ Authentication token obtained for user:', user.id);
      } catch (tokenError) {
        console.error('❌ Failed to get authentication token:', tokenError);
        alert('Authentication failed. Please sign in again.');
        return;
      }
    }

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authentication header if user is signed in
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Adding authentication header to request');
    }

    // Determine which endpoint to use
    const endpoint = user ? 'customer-bargain' : 'bargain';
    const url = `${API_BASE_URL}/api/trips/${endpoint}`;
    
    console.log('📡 Making request to:', url);
    console.log('📋 Request headers:', headers);

    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(formData)
    });

    console.log('📊 Response status:', response.status);

    // Handle different response statuses
    if (response.status === 401) {
      alert('Authentication required. Please sign in and try again.');
      // Optionally redirect to sign-in page
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

    // Parse successful response
    const result = await response.json();
    console.log('✅ Bargain request submitted successfully:', result);
    
    // Show success message
    if (user) {
      alert('🎉 Bargain request submitted successfully!\n\nYou can check its status in "Your Bargains" section.');
    } else {
      alert('🎉 Bargain request submitted successfully!\n\nThe agency will contact you at the provided phone number.');
    }

    // Reset form to initial state
    setBudget('');
    setStartDate('');
    setEndDate('');
    setDestination('');
    setSelectedAgency('');
    setSelectedTrip('');
    setPhoneNumber('');
    setFilteredTrips([]);
    setIsAgencyPreFilled(false);

    // Navigate back to trip details if came from there
    if (preSelectedTrip) {
      console.log('🔄 Navigating back to trip details:', preSelectedTrip._id);
      navigate(`/trip/${preSelectedTrip._id}`);
    } else if (user) {
      // Optionally navigate to user's bargains page
      console.log('🔄 Optionally navigate to your bargains page');
      // navigate('/your-bargains');
    }

  } catch (error) {
    console.error('❌ Error submitting bargain request:', error);
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      alert('❌ Network error. Please check your internet connection and try again.');
    } else if (error.message.includes('Authentication')) {
      alert('❌ Authentication error. Please sign in again and try.');
    } else {
      alert(`❌ Failed to submit bargain request: ${error.message}\n\nPlease try again.`);
    }
  } finally {
    // Restore button state
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Deal</h1>
            <p className="text-lg text-gray-600">Tell us your preferences and let us find the best travel deals for you</p>
            
            {/* Agency pre-filled notification */}
            {isAgencyPreFilled && preSelectedAgency && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center text-blue-800">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    Agency pre-selected: <strong>{preSelectedAgency?.name}</strong> - Now choose your trip package
                  </span>
                </div>
              </div>
            )}
            
            {/* User status */}
            {user && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  ✅ Signed in as <span className="font-medium">{user.firstName || 'User'}</span> 
                  - Your requests will be saved to "Your Bargains"
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
          {/* Passengers */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">Travellers</label>
            <div className="space-y-2">
              {passengers.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <select
                    value={p.gender}
                    onChange={(e) => setPassengers(prev => prev.map((x,i)=> i===idx? { ...x, gender: e.target.value }: x))}
                    className="px-2 py-2 border rounded w-32"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Age"
                    value={p.age}
                    onChange={(e) => setPassengers(prev => prev.map((x,i)=> i===idx? { ...x, age: e.target.value }: x))}
                    className="px-3 py-2 border rounded w-28"
                    min="0"
                    max="120"
                  />
                  {passengers.length > 1 && (
                    <button type="button" onClick={() => setPassengers(prev => prev.filter((_,i)=>i!==idx))} className="text-red-600 text-sm">Remove</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPassengers(prev => [...prev, { gender: 'Other', age: '' }])} className="mt-2 text-sm px-2 py-1 rounded bg-emerald-100 text-emerald-800">+ Add Traveller</button>
          </div>
            {/* Phone Number Input */}
            <div>
              <label htmlFor="phoneNumber" className="block text-lg font-semibold text-gray-700 mb-3">
                Your Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
              <p className="text-sm text-gray-500 mt-2">We'll use this to contact you about deals</p>
            </div>

            {/* Agency Selection */}
            <div>
              <label htmlFor="selectedAgency" className="block text-lg font-semibold text-gray-700 mb-3">
                Select Travel Agency
              </label>
              <select
                id="selectedAgency"
                value={selectedAgency}
                onChange={(e) => {
                  console.log('🏢 Agency selection:', e.target.value);
                  setSelectedAgency(e.target.value);
                  setSelectedTrip(''); // Reset trip when agency changes
                }}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              >
                <option value="">Choose an agency first</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                {isAgencyPreFilled ? 
                  `✅ Pre-selected: ${preSelectedAgency?.name}` :
                  `Select the agency you want to get deals from (${agencies.length} agencies available)`
                }
              </p>
            </div>

            {/* Trip Selection */}
            <div>
              <label htmlFor="selectedTrip" className="block text-lg font-semibold text-gray-700 mb-3">
                Select Trip Package
              </label>
              
              <select
                id="selectedTrip"
                value={selectedTrip}
                onChange={(e) => {
                  console.log('🎯 Trip selection:', e.target.value);
                  setSelectedTrip(e.target.value);
                }}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
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

            {/* Budget Input */}
            <div>
              <label htmlFor="budget" className="block text-lg font-semibold text-gray-700 mb-3">
                Your Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">₹</span>
                <input
                  type="number"
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Enter your budget"
                  className="w-full pl-10 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Enter your total travel budget in Indian Rupees</p>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Travel Dates
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
                    min={startDate}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Select your preferred travel dates</p>
            </div>

            {/* Destination Input */}
            <div>
              <label htmlFor="destination" className="block text-lg font-semibold text-gray-700 mb-3">
                Select Your Destination
              </label>
              <input
                type="text"
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where do you want to go?"
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                {isAgencyPreFilled ? 'Pre-filled from selected trip (you can modify)' : 'Enter your desired destination'}
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105"
              >
                Get Deal from {selectedAgency ? agencies.find(a => a.id === selectedAgency)?.name : 'Selected Agency'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              <span className="font-semibold">💡 Tip:</span> {user 
                ? 'Your requests will be saved and you can track them in "Your Bargains"!' 
                : 'Sign in to track your bargain requests!'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bargain;
