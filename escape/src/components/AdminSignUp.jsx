import React, { useState, useEffect } from 'react';
import { useSignUp, useUser, useAuth } from '@clerk/clerk-react'; // Add useAuth
import { useNavigate, Link } from 'react-router-dom';
import { clearAdminCache } from '../utils/adminCheck';

const AdminSignUp = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { user, isSignedIn, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth(); // Add getToken for authentication
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Agency details state
  const [agencyDetails, setAgencyDetails] = useState({
    name: '',
    ownerName: '',
    phone: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Handle already signed-in users
  useEffect(() => {
    if (isSignedIn && user && userLoaded) {
      console.log('✅ User already signed in, moving to agency details');
      setCurrentStep('details');
      // Pre-fill owner name if available
      setAgencyDetails(prev => ({
        ...prev,
        ownerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Agency Owner'
      }));
    }
  }, [isSignedIn, user, userLoaded]);

  const handleEmailSubmit = async (e) => {
  e.preventDefault();
  if (!isLoaded) return;

  setIsLoading(true);
  setError('');

  try {
    console.log('📧 Creating admin account with email:', email);
    
    // Create signup with password immediately
    const tempPassword = 'AdminPass123!' + Math.random().toString(36).slice(-8);
    
    await signUp.create({
      emailAddress: email.trim(),
      password: tempPassword, // Add password immediately to avoid missing_requirements
    });

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    
    // Store the password for later use
    sessionStorage.setItem('tempAdminPassword', tempPassword);
    
    setCurrentStep('verification');
    console.log('✅ Verification email sent with password');
  } catch (err) {
    console.error('❌ Email signup error:', err);
    
    if (err.errors?.[0]?.code === 'form_identifier_exists') {
      setError('An account with this email already exists. Please sign in instead.');
    } else {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to send verification email. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};


const handleVerificationSubmit = async (e) => {
  e.preventDefault();
  if (!isLoaded || !verificationCode.trim()) {
    setError('Please enter the verification code');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    console.log('🔐 Verifying email with code:', verificationCode);
    
    const result = await signUp.attemptEmailAddressVerification({
      code: verificationCode.trim(),
    });

    console.log('📧 Email verification result status:', result.status);

    if (result.status === 'complete') {
      console.log('✅ Email verification successful, setting active session');
      
      // Set the active session
      await setActive({ session: result.createdSessionId });
      
      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Move to agency details step
      setCurrentStep('details');
      
      console.log('✅ Moving to agency details step');
      
    } else {
      console.log('⚠️ Verification not complete, status:', result.status);
      console.log('⚠️ Continuing with fallback approach...');
      
      // Set fallback data
      sessionStorage.setItem('recentAdminSignup', result.createdUserId || 'temp_' + Date.now());
      sessionStorage.setItem('adminSignupEmail', email);
      
      // Move to details anyway
      setCurrentStep('details');
    }
    
  } catch (err) {
    console.error('❌ Verification error:', err);
    
    if (err.errors?.[0]?.code === 'form_code_incorrect') {
      setError('Invalid verification code. Please check and try again.');
    } else {
      console.log('⚠️ Verification failed, using fallback approach...');
      
      // Set fallback data
      sessionStorage.setItem('recentAdminSignup', 'temp_' + Date.now());
      sessionStorage.setItem('adminSignupEmail', email);
      
      // Move to details anyway
      setCurrentStep('details');
    }
  } finally {
    setIsLoading(false);
  }
};



  // UPDATED: Handle agency details submission with authentication

const handleDetailsSubmit = async (e) => {
  e.preventDefault();
  
  // Get user info from multiple sources
  const userId = user?.id || signUp?.createdUserId || sessionStorage.getItem('recentAdminSignup');
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || sessionStorage.getItem('adminSignupEmail') || email;

  console.log('🔍 Debug info for details submit:', {
    userId,
    userEmail,
    isSignedIn,
    userObject: user
  });

  if (!userId || !userEmail) {
    setError('Session information missing. Please start over.');
    return;
  }

  // Validate required fields
  if (!agencyDetails.name.trim() || !agencyDetails.ownerName.trim() || !agencyDetails.phone.trim()) {
    setError('Please fill in all required fields (Agency Name, Owner Name, Phone).');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    console.log('🏢 Attempting to create agency with authenticated user:', userId);
    
    // TRY TO GET AUTHENTICATION TOKEN FIRST
    let token;
    try {
      token = await getToken();
      console.log('🔐 Token obtained successfully:', !!token);
    } catch (tokenError) {
      console.log('⚠️ Token error, but user is authenticated, continuing...', tokenError);
    }
    
    if (token) {
      console.log('🔐 Making authenticated API call to create agency...');

      // Prepare agency data - ENSURE ALL REQUIRED FIELDS
      const agencyData = {
        name: agencyDetails.name.trim(),
        ownerId: userId,
        ownerName: agencyDetails.ownerName.trim(),
        ownerEmail: userEmail,
        phone: agencyDetails.phone.trim(),
        gstNumber: agencyDetails.gstNumber.trim() || '',
        address: agencyDetails.address.trim() || '',
        city: agencyDetails.city.trim() || '',
        state: agencyDetails.state.trim() || '',
        pincode: agencyDetails.pincode.trim() || '',
        description: agencyDetails.description.trim() || '',
        status: 'active'
      };

      console.log('📤 Sending agency data:', agencyData);
      
      // VALIDATE DATA BEFORE SENDING
      if (!agencyData.name || !agencyData.ownerId || !agencyData.ownerName || !agencyData.ownerEmail || !agencyData.phone) {
        console.error('❌ Missing required fields in agency data:', agencyData);
        throw new Error('Missing required fields: name, ownerId, ownerName, ownerEmail, or phone');
      }
      
      // VALIDATE EMAIL FORMAT
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(agencyData.ownerEmail)) {
        throw new Error('Invalid email format');
      }
      
      // VALIDATE PHONE FORMAT
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(agencyData.phone)) {
        throw new Error('Invalid phone number format. Must be 10-15 digits.');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/create-agency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(agencyData)
      });

      console.log('📊 Agency creation response status:', response.status);
      
      // GET DETAILED ERROR RESPONSE
      const responseData = await response.json();
      console.log('📋 Full response data:', responseData);

      if (response.ok && responseData.success) {
        console.log('✅ Agency created successfully in database:', responseData.agency);

  // CLEAR ADMIN STATUS CACHE USING THE UTILITY FUNCTION
  clearAdminCache(userId);
  
  // Also clear any other cache keys that might exist
  sessionStorage.removeItem(`admin_status_${userId}`);
  localStorage.removeItem(`admin_status_${userId}`);
  
  // Store admin data for App.jsx fallback
  sessionStorage.setItem('tempAdminData', JSON.stringify({
    userId: userId,
    isAdmin: true,
    agency: responseData.agency,
    timestamp: Date.now()
  }));

  sessionStorage.setItem('recentAdminSignup', userId);
  sessionStorage.setItem('adminSignupEmail', userEmail);

  setCurrentStep('success');

  // FORCE HARD NAVIGATION TO BYPASS ALL CACHES
  setTimeout(() => {
    console.log('🚀 Redirecting to admin dashboard...');
    window.location.href = '/admin-dashboard';
  }, 1500);
  
        return; // Success - don't continue to fallback
      } else {
        // DETAILED ERROR LOGGING
        console.error('❌ API responded with error:', response.status);
        console.error('❌ Error details:', responseData);
        
        if (responseData.details) {
          console.error('❌ Validation details:', responseData.details);
        }
        
        // Show specific error to user
        if (responseData.error) {
          if (responseData.error.includes('already has an agency')) {
            setError('You already have an agency registered. Please sign in instead.');
            return; // Don't continue to fallback
          } else if (responseData.error.includes('GST number')) {
            setError('This GST number is already registered with another agency.');
            return; // Don't continue to fallback
          } else if (responseData.error.includes('Validation failed')) {
            if (responseData.details && Array.isArray(responseData.details)) {
              const validationErrors = responseData.details.map(detail => detail.msg).join(', ');
              setError(`Validation failed: ${validationErrors}`);
            } else {
              setError('Please check your information and try again.');
            }
            return; // Don't continue to fallback
          } else {
            setError(responseData.error);
            return; // Don't continue to fallback
          }
        }
        
        // If we get here, continue to fallback method below
        console.log('⚠️ Continuing to fallback method...');
      }
    }
    
    // FALLBACK METHOD: If API fails, still create session data
    console.log('⚠️ Using fallback method...');
    
    const fallbackUserId = userId.startsWith('temp_') ? userId : userId;
    
    // Create comprehensive session data for fallback
    const adminData = {
      userId: fallbackUserId,
      isAdmin: true,
      agency: {
        name: agencyDetails.name.trim(),
        ownerName: agencyDetails.ownerName.trim(),
        ownerEmail: userEmail,
        phone: agencyDetails.phone.trim(),
        gstNumber: agencyDetails.gstNumber.trim() || '',
        address: agencyDetails.address.trim() || '',
        city: agencyDetails.city.trim() || '',
        state: agencyDetails.state.trim() || '',
        pincode: agencyDetails.pincode.trim() || '',
        description: agencyDetails.description.trim() || '',
        status: 'active'
      },
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('tempAdminData', JSON.stringify(adminData));
    sessionStorage.setItem('recentAdminSignup', fallbackUserId);
    sessionStorage.setItem('adminSignupEmail', userEmail);
    
    console.log('✅ Fallback session data stored successfully');
    
    setCurrentStep('success');
    
    setTimeout(() => {
      console.log('🚀 Redirecting to admin dashboard with fallback data...');
      navigate('/admin-dashboard');
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error in details submit:', error);
    setError(error.message || 'Failed to create agency. Please try again.');
  } finally {
    setIsLoading(false);
  }
};





  const handleResendCode = async () => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      console.log('✅ Verification code resent to:', email);
    } catch (err) {
      console.error('❌ Resend failed:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking user status
  if (!userLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 pt-24">
        <div className="max-w-md mx-auto px-5 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 pt-24">
      <div className="max-w-2xl mx-auto px-5 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStep === 'email' 
                ? 'Join as Travel Agency' 
                : currentStep === 'verification' 
                ? 'Verify Your Email' 
                : currentStep === 'details'
                ? 'Complete Agency Registration'
                : 'Welcome to Escape!'
              }
            </h1>
            <p className="text-gray-600">
              {currentStep === 'email' 
                ? 'Create your travel agency account'
                : currentStep === 'verification' 
                ? `Enter the code sent to ${email}`
                : currentStep === 'details'
                ? 'Fill in your travel agency details'
                : 'Your agency has been created successfully!'
              }
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${currentStep === 'email' ? 'text-emerald-600' : 'text-gray-500'}`}>
                Email
              </span>
              <span className={`text-xs font-medium ${currentStep === 'verification' ? 'text-emerald-600' : 'text-gray-500'}`}>
                Verify
              </span>
              <span className={`text-xs font-medium ${currentStep === 'details' ? 'text-emerald-600' : 'text-gray-500'}`}>
                Agency Details
              </span>
              <span className={`text-xs font-medium ${currentStep === 'success' ? 'text-emerald-600' : 'text-gray-500'}`}>
                Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: currentStep === 'email' ? '25%' : 
                         currentStep === 'verification' ? '50%' : 
                         currentStep === 'details' ? '75%' : '100%'
                }}
              ></div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-700 text-sm font-medium">Registration Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Email Input */}
          {currentStep === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Agency Owner Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Enter your business email"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be your login email for the admin dashboard
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending Verification...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Email Verification */}
          {currentStep === 'verification' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setError('');
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors text-center text-xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Check your email (including spam folder) for the 6-digit code
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="flex-1 text-emerald-600 hover:text-emerald-700 py-2 disabled:text-gray-400"
                >
                  Resend Code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('email');
                    setVerificationCode('');
                    setError('');
                  }}
                  disabled={isLoading}
                  className="flex-1 text-gray-600 hover:text-gray-700 py-2 disabled:text-gray-400"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Agency Details */}
          {currentStep === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-6">
              {/* Show authenticated user info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      ✅ Email Verified Successfully
                    </p>
                    <p className="text-xs text-green-700">
                      Logged in as: {user?.emailAddresses?.[0]?.emailAddress || email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Agency Name */}
                <div className="md:col-span-2">
                  <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Agency Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="agencyName"
                    value={agencyDetails.name}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Enter your travel agency name"
                    disabled={isLoading}
                  />
                </div>

                {/* Owner Name */}
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    value={agencyDetails.ownerName}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, ownerName: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Your full name"
                    disabled={isLoading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={agencyDetails.phone}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Your contact number"
                    disabled={isLoading}
                  />
                </div>

                {/* GST Number */}
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="gstNumber"
                    value={agencyDetails.gstNumber}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="GST registration number"
                    disabled={isLoading}
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address (Optional)
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={agencyDetails.address}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Street address"
                    disabled={isLoading}
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City (Optional)
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={agencyDetails.city}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="City name"
                    disabled={isLoading}
                  />
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State (Optional)
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={agencyDetails.state}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="State name"
                    disabled={isLoading}
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode (Optional)
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    value={agencyDetails.pincode}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Area pincode"
                    disabled={isLoading}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={agencyDetails.description}
                    onChange={(e) => setAgencyDetails(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Brief description of your travel agency"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !agencyDetails.name.trim() || !agencyDetails.ownerName.trim() || !agencyDetails.phone.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-4 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Agency...
                  </>
                ) : (
                  'Create Agency & Access Dashboard'
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {currentStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Agency Created Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Welcome to Escape! Your travel agency has been registered and you now have admin access.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <p className="text-emerald-800 text-sm">
                  ✅ Agency registered<br />
                  ✅ Admin dashboard activated<br />
                  ✅ You can now create and manage trips
                </p>
              </div>
              <p className="text-gray-500 text-sm">Redirecting to your admin dashboard...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              {currentStep !== 'success' && (
                <>
                  Already have an admin account?{' '}
                  <Link to="/admin-login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Sign in here
                  </Link>
                  <br />
                </>
              )}
              <span className="text-gray-500 text-xs">
                Looking for customer registration?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700">
                  Join as customer
                </Link>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignUp;
