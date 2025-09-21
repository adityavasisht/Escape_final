import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react'; // Add useAuth
import Select from 'react-select';

const AddTripForm = ({ trip, onClose, onSubmit }) => {
  const { user } = useUser();
  const { getToken } = useAuth(); // Add getToken for authentication
  const [formData, setFormData] = useState({
    tripName: '',
    totalBudget: '',
    selectedLocations: [],
    departureDate: '',
    departureTime: '',
    transportMedium: null,
    departureLocation: '',
    arrivalDate: '',
    arrivalTime: '',
    arrivalLocation: '',
    description: '',
    inclusions: '',
    exclusions: '',
    maxCapacity: '',
    itineraryImages: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Debug current admin
  console.log('🔍 AddTripForm - Current admin user ID:', user?.id);

  // Comprehensive list of Indian tourist cities
  const indianCities = [
    { label: 'Agra', value: 'Agra' },
    { label: 'Ahmedabad', value: 'Ahmedabad' },
    { label: 'Ajmer', value: 'Ajmer' },
    { label: 'Alleppey', value: 'Alleppey' },
    { label: 'Amritsar', value: 'Amritsar' },
    { label: 'Andaman Islands', value: 'Andaman Islands' },
    { label: 'Aurangabad', value: 'Aurangabad' },
    { label: 'Bangalore', value: 'Bangalore' },
    { label: 'Bhopal', value: 'Bhopal' },
    { label: 'Bhubaneswar', value: 'Bhubaneswar' },
    { label: 'Chandigarh', value: 'Chandigarh' },
    { label: 'Chennai', value: 'Chennai' },
    { label: 'Coimbatore', value: 'Coimbatore' },
    { label: 'Darjeeling', value: 'Darjeeling' },
    { label: 'Dehradun', value: 'Dehradun' },
    { label: 'Delhi', value: 'Delhi' },
    { label: 'Gangtok', value: 'Gangtok' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Guwahati', value: 'Guwahati' },
    { label: 'Hampi', value: 'Hampi' },
    { label: 'Haridwar', value: 'Haridwar' },
    { label: 'Hyderabad', value: 'Hyderabad' },
    { label: 'Indore', value: 'Indore' },
    { label: 'Jaipur', value: 'Jaipur' },
    { label: 'Jaisalmer', value: 'Jaisalmer' },
    { label: 'Jammu', value: 'Jammu' },
    { label: 'Jodhpur', value: 'Jodhpur' },
    { label: 'Kanyakumari', value: 'Kanyakumari' },
    { label: 'Kochi', value: 'Kochi' },
    { label: 'Kolkata', value: 'Kolkata' },
    { label: 'Leh Ladakh', value: 'Leh Ladakh' },
    { label: 'Lucknow', value: 'Lucknow' },
    { label: 'Madurai', value: 'Madurai' },
    { label: 'Manali', value: 'Manali' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Munnar', value: 'Munnar' },
    { label: 'Mysore', value: 'Mysore' },
    { label: 'Nainital', value: 'Nainital' },
    { label: 'Ooty', value: 'Ooty' },
    { label: 'Patna', value: 'Patna' },
    { label: 'Pondicherry', value: 'Pondicherry' },
    { label: 'Pune', value: 'Pune' },
    { label: 'Pushkar', value: 'Pushkar' },
    { label: 'Rameswaram', value: 'Rameswaram' },
    { label: 'Rishikesh', value: 'Rishikesh' },
    { label: 'Shimla', value: 'Shimla' },
    { label: 'Srinagar', value: 'Srinagar' },
    { label: 'Thiruvananthapuram', value: 'Thiruvananthapuram' },
    { label: 'Tirupati', value: 'Tirupati' },
    { label: 'Udaipur', value: 'Udaipur' },
    { label: 'Varanasi', value: 'Varanasi' },
    { label: 'Vashisht', value: 'Vashisht' },
  ];

  const transportOptions = [
    { label: 'Bus', value: 'bus' },
    { label: 'Train', value: 'train' },
    { label: 'Flight', value: 'flight' },
    { label: 'Car', value: 'car' },
    { label: 'Boat', value: 'boat' },
    { label: 'Mixed (Multiple)', value: 'mixed' }
  ];

  // Initialize form data when trip prop changes (for editing)
  useEffect(() => {
    if (trip) {
      console.log('🔧 Editing trip:', trip);
      
      // Convert locations array to select format
      const formattedLocations = trip.locations 
        ? trip.locations.map(loc => ({ label: loc, value: loc }))
        : [];

      // Convert transport medium to select format
      const formattedTransport = trip.transportMedium
        ? transportOptions.find(option => option.value === trip.transportMedium)
        : null;

      // Parse date and time from ISO string
      const parseDepartureDateTime = (isoString) => {
        if (!isoString) return { date: '', time: '' };
        const date = new Date(isoString);
        return {
          date: date.toISOString().split('T')[0],
          time: date.toTimeString().split(' ')[0].slice(0, 5)
        };
      };

      const parseArrivalDateTime = (isoString) => {
        if (!isoString) return { date: '', time: '' };
        const date = new Date(isoString);
        return {
          date: date.toISOString().split('T')[0],
          time: date.toTimeString().split(' ')[0].slice(0, 5)
        };
      };

      const departureDateTime = parseDepartureDateTime(trip.departureDateTime);
      const arrivalDateTime = parseArrivalDateTime(trip.arrivalDateTime);

      setFormData({
        tripName: trip.tripName || '',
        totalBudget: trip.totalBudget ? trip.totalBudget.toString() : '',
        selectedLocations: formattedLocations,
        departureDate: departureDateTime.date,
        departureTime: departureDateTime.time,
        transportMedium: formattedTransport,
        departureLocation: trip.departureLocation || '',
        arrivalDate: arrivalDateTime.date,
        arrivalTime: arrivalDateTime.time,
        arrivalLocation: trip.arrivalLocation || '',
        description: trip.description || '',
        inclusions: trip.inclusions || '',
        exclusions: trip.exclusions || '',
        maxCapacity: trip.maxCapacity ? trip.maxCapacity.toString() : '',
        itineraryImages: [],
      });

      // If editing and trip has existing images, show them
      if (trip.itineraryImages && trip.itineraryImages.length > 0) {
        const existingPreviews = trip.itineraryImages.map((img, index) => ({
          url: img.url,
          name: img.originalName || `Image ${index + 1}`,
          isExisting: true
        }));
        setImagePreviews(existingPreviews);
      } else {
        setImagePreviews([]);
      }
    } else {
      // Reset form for new trip
      console.log('🆕 Creating new trip for admin:', user?.id);
      setFormData({
        tripName: '',
        totalBudget: '',
        selectedLocations: [],
        departureDate: '',
        departureTime: '',
        transportMedium: null,
        departureLocation: '',
        arrivalDate: '',
        arrivalTime: '',
        arrivalLocation: '',
        description: '',
        inclusions: '',
        exclusions: '',
        maxCapacity: '',
        itineraryImages: [],
      });
      setImagePreviews([]);
    }
  }, [trip, user?.id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Create preview URLs
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      isExisting: false
    }));
    
    setImagePreviews([...imagePreviews, ...previews]);
    setFormData(prev => ({
      ...prev,
      itineraryImages: [...prev.itineraryImages, ...files]
    }));
  };

  // Remove image from selection
  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = formData.itineraryImages.filter((_, i) => i !== index);
    
    // Clean up URL objects to prevent memory leaks
    if (imagePreviews[index] && !imagePreviews[index].isExisting) {
      URL.revokeObjectURL(imagePreviews[index].url);
    }
    
    setImagePreviews(newPreviews);
    setFormData(prev => ({
      ...prev,
      itineraryImages: newImages
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.tripName.trim()) {
      errors.push('Trip name is required');
    }

    if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
      errors.push('Valid total budget is required');
    }

    if (formData.selectedLocations.length === 0) {
      errors.push('Please select at least one location');
    }

    if (!formData.maxCapacity || parseInt(formData.maxCapacity) <= 0) {
      errors.push('Valid maximum capacity is required');
    }

    // Only validate dates if they are provided
    if (formData.departureDate && formData.arrivalDate) {
      const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime || '00:00'}`);
      const arrivalDateTime = new Date(`${formData.arrivalDate}T${formData.arrivalTime || '00:00'}`);

      if (arrivalDateTime <= departureDateTime) {
        errors.push('Arrival date and time must be after departure');
      }
    }

    return errors;
  };

  // UPDATED: Handle form submission with authentication
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate current user
      if (!user?.id) {
        throw new Error('User session not found. Please refresh and try again.');
      }

      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // GET AUTHENTICATION TOKEN
      console.log('🔐 Getting authentication token...');
      const token = await getToken();
      
      if (!token) {
        throw new Error('Failed to get authentication token. Please sign in again.');
      }

      console.log('✅ Token obtained, preparing form data...');

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // SIMPLE: Only set adminId (no agencyId needed)
      formDataToSend.append('adminId', user.id);
      
      // ✅ Generate OTP for new trips
      if (!trip) {
        const tripOTP = Math.floor(1000 + Math.random() * 9000).toString();
        formDataToSend.append('tripOTP', tripOTP);
        console.log('🎯 Generated OTP for new trip:', tripOTP);
      }
      
      // Add all form fields
      formDataToSend.append('tripName', formData.tripName.trim());
      formDataToSend.append('totalBudget', parseFloat(formData.totalBudget));
      formDataToSend.append('locations', JSON.stringify(formData.selectedLocations.map(loc => loc.value)));
      formDataToSend.append('maxCapacity', parseInt(formData.maxCapacity));
      
      // Optional fields
      if (formData.departureDate && formData.departureTime) {
        formDataToSend.append('departureDateTime', `${formData.departureDate}T${formData.departureTime}`);
      }
      if (formData.arrivalDate && formData.arrivalTime) {
        formDataToSend.append('arrivalDateTime', `${formData.arrivalDate}T${formData.arrivalTime}`);
      }
      if (formData.transportMedium) {
        formDataToSend.append('transportMedium', formData.transportMedium.value);
      }
      if (formData.departureLocation.trim()) {
        formDataToSend.append('departureLocation', formData.departureLocation.trim());
      }
      if (formData.arrivalLocation.trim()) {
        formDataToSend.append('arrivalLocation', formData.arrivalLocation.trim());
      }
      if (formData.description.trim()) {
        formDataToSend.append('description', formData.description.trim());
      }
      if (formData.inclusions.trim()) {
        formDataToSend.append('inclusions', formData.inclusions.trim());
      }
      if (formData.exclusions.trim()) {
        formDataToSend.append('exclusions', formData.exclusions.trim());
      }
      
      // Add image files
      formData.itineraryImages.forEach(file => {
        formDataToSend.append('itineraryImages', file);
      });

      console.log(`🚀 ${trip ? 'Updating' : 'Creating'} trip for admin: ${user.id} with ${formData.itineraryImages.length} images`);

      // Debug: Log all form data
      console.log('📤 Form data being sent:');
      for (let pair of formDataToSend.entries()) {
        if (pair[0] !== 'itineraryImages') { // Don't log file objects
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      // Determine API endpoint and method
      const url = trip 
        ? `${API_BASE_URL}/api/admin/trips/${trip._id}`
        : `${API_BASE_URL}/api/admin/trips`;
      
      const method = trip ? 'PUT' : 'POST';

      // UPDATED: Call API with authentication header
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}` // CRITICAL: Add auth header
          // Don't add Content-Type for FormData - browser will set it with boundary
        },
        body: formDataToSend
      });

      console.log('📊 API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You can only create trips for your own agency.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Backend error response:', errorData);
          throw new Error(errorData.error || `Failed to ${trip ? 'update' : 'create'} trip`);
        }
      }

      const result = await response.json();
      console.log(`✅ Trip ${trip ? 'updated' : 'created'} successfully by admin ${user.id}:`, result);
      
      // ✅ Show OTP in success message
      const successMessage = trip 
        ? `Trip "${formData.tripName}" updated successfully! 🎉`
        : `Trip "${formData.tripName}" created successfully! 🎉\n\nYour Trip OTP: ${formDataToSend.get('tripOTP')}\n\nSave this OTP - customers will need it when booking!`;
      
      alert(successMessage);
      
      // Cleanup image URLs
      imagePreviews.forEach(preview => {
        if (preview.url && !preview.isExisting) {
          URL.revokeObjectURL(preview.url);
        }
      });
      
      // Callback to parent component
      if (onSubmit) onSubmit(result.trip);
      
      // Close form
      onClose();

    } catch (err) {
      console.error('❌ Form submission error:', err);
      
      // Handle different types of errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message.includes('authentication') || err.message.includes('token')) {
        setError('Authentication error. Please sign out and sign in again.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {trip ? '✏️ Edit Trip Package' : '➕ Add New Trip Package'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Admin: {user?.firstName || 'Admin'} ({user?.id?.slice(-8) || 'Unknown'})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Security Status Indicator */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">
                  🔐 Secure Trip Creation
                </p>
                <p className="text-xs text-green-700">
                  This trip will be created with your authenticated admin credentials and secure data isolation.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 text-sm font-medium">
                    Please fix the following errors:
                  </p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tripName}
                    onChange={(e) => handleInputChange('tripName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter trip name"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget (INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalBudget}
                    onChange={(e) => handleInputChange('totalBudget', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter total budget"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Locations <span className="text-red-500">*</span>
                </label>
                <Select
                  options={indianCities}
                  value={formData.selectedLocations}
                  onChange={(value) => handleInputChange('selectedLocations', value)}
                  isMulti
                  isSearchable
                  placeholder="Search and select cities to visit"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isDisabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select multiple destinations for your trip
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxCapacity}
                  onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Maximum number of travelers"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Travel Details (Optional) */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🚗 Travel Details (Optional)</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medium of Transportation
                </label>
                <Select
                  options={transportOptions}
                  value={formData.transportMedium}
                  onChange={(value) => handleInputChange('transportMedium', value)}
                  placeholder="Select transport medium"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isDisabled={isLoading}
                  isClearable
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Location
                  </label>
                  <input
                    type="text"
                    value={formData.departureLocation}
                    onChange={(e) => handleInputChange('departureLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter departure location"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Location
                  </label>
                  <input
                    type="text"
                    value={formData.arrivalLocation}
                    onChange={(e) => handleInputChange('arrivalLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter arrival location"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleInputChange('departureDate', e.target.value)}
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => handleInputChange('departureTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                    min={formData.departureDate || today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📝 Additional Information</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Describe the trip, activities, and highlights..."
                  disabled={isLoading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inclusions
                  </label>
                  <textarea
                    value={formData.inclusions}
                    onChange={(e) => handleInputChange('inclusions', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="What's included in the package..."
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclusions
                  </label>
                  <textarea
                    value={formData.exclusions}
                    onChange={(e) => handleInputChange('exclusions', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="What's not included..."
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Itinerary Images */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📸 Trip Itinerary Images</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Destination Images
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload images of destinations covered in this trip to showcase the itinerary
                </p>
                
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors"
                  disabled={isLoading}
                />
                
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: JPG, PNG, GIF (Max 5MB per image)
                </p>
              </div>
              
              {/* Image Previews Grid */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Selected Images ({imagePreviews.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={preview.url}
                            alt={`Destination ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                          />
                        </div>
                        
                        {!preview.isExisting && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            disabled={isLoading}
                          >
                            ×
                          </button>
                        )}
                        
                        <p className="text-xs text-gray-600 mt-1 truncate text-center">
                          {preview.name}
                        </p>
                        
                        {preview.isExisting && (
                          <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                            Existing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>
                  {isLoading 
                    ? (trip ? 'Updating Trip...' : 'Creating Trip...') 
                    : (trip ? '✏️ Update Trip' : '➕ Create Trip')
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTripForm;
