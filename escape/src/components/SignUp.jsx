import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';

const SignUp = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('email');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Step 1: Email submission - FIXED
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      // Create the sign up with minimal required data first
      const result = await signUp.create({
        emailAddress: formData.email,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ 
        strategy: 'email_code' 
      });
      
      // Auto-fill name from email
      const emailName = formData.email.split('@')[0];
      setFormData(prev => ({
        ...prev,
        name: prev.name || emailName
      }));
      
      setCurrentStep('verification');
    } catch (err) {
      console.error('Email submission error:', err);
      setError(err.errors?.[0]?.message || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verification - FIXED
  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || !verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Attempt email verification
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      console.log('Verification result:', completeSignUp.status);

      if (completeSignUp.status === 'missing_requirements') {
        // Move to details step if verification successful but needs more info
        setCurrentStep('details');
      } else if (completeSignUp.status === 'complete') {
        // If signup is complete, set active session and redirect
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Additional details - FIXED
  const handleDetailsSubmit = async (e) => {
  e.preventDefault();
  if (!isLoaded) return;

  setIsLoading(true);
  setError('');

  try {
    // CORRECTED: Only update with password and metadata
    const result = await signUp.update({
      password: formData.password,
      // Store name, phone, and address in publicMetadata since firstName/lastName aren't allowed at this stage
      publicMetadata: {
        fullName: formData.name,
        phone: formData.phone,
        address: formData.address
      }
    });

    // After successful update, complete the signup
    if (result.status === 'complete') {
      await setActive({ session: result.createdSessionId });
      navigate('/');
    } else {
      console.log('Signup status:', result.status);
      setError('Signup incomplete. Please try again.');
    }
  } catch (err) {
    console.error('Details submission error:', err);
    setError(err.errors?.[0]?.message || 'Failed to complete signup');
  } finally {
    setIsLoading(false);
  }
};

  // Add a "Resend Code" function
  const handleResendCode = async () => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setError(''); // Clear any previous errors
      // You could show a success message here
      console.log('Verification code resent');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-5">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Escape</h1>
          <p className="text-gray-600">Create your account to start your journey</p>
          
          {/* Progress Indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            <div className={`w-2 h-2 rounded-full ${currentStep === 'email' ? 'bg-blue-500' : currentStep === 'verification' || currentStep === 'details' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'verification' ? 'bg-blue-500' : currentStep === 'details' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'details' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Email */}
        {currentStep === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Sending...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Verification - ENHANCED */}
        {currentStep === 'verification' && (
          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <p className="text-sm text-gray-600 mb-3">
                We've sent a 6-digit verification code to <strong>{formData.email}</strong>
              </p>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError(''); // Clear error when typing
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-center text-xl tracking-widest font-mono"
                placeholder="123456"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Code Button */}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full text-blue-500 hover:text-blue-600 py-2 text-sm"
            >
              Didn't receive the code? Resend
            </button>
          </form>
        )}

        {/* Step 3: Details - Keep your existing details form */}
        {currentStep === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email-display" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email-display"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Create a password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M5.636 5.636l12.728 12.728M9.88 9.88l4.24 4.24M9.88 9.88a3 3 0 104.24 4.24" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                placeholder="Enter your address"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
