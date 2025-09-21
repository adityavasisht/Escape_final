import React, { useState, useEffect } from 'react';
import { useSignIn, useUser, useClerk, useAuth } from '@clerk/clerk-react'; // Add useAuth
import { useNavigate, Link } from 'react-router-dom';

const AdminLogin = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user, isSignedIn, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth(); // Add getToken for authentication
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [checkingAdminStatus, setCheckingAdminStatus] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // UPDATED: Function to check admin status with authentication
  const checkAdminStatus = async (currentUser) => {
    try {
      console.log('🔍 Checking admin status for user:', currentUser.id);
      
      // GET AUTHENTICATION TOKEN
      const token = await getToken();
      
      if (!token) {
        console.error('❌ Failed to get authentication token');
        return { success: true, isAdmin: false, agency: null };
      }

      console.log('🔐 Token obtained, making authenticated request...');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/check-admin-status/${currentUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // CRITICAL: Add auth header
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Admin status response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Admin status response data:', data);
        return data;
      } else if (response.status === 401) {
        console.error('❌ Authentication failed for admin status check');
        return { success: true, isAdmin: false, agency: null };
      } else if (response.status === 403) {
        console.error('❌ Access denied for admin status check');
        return { success: true, isAdmin: false, agency: null };
      } else {
        console.error('❌ Admin status check failed:', response.status);
        return { success: true, isAdmin: false, agency: null };
      }
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return { success: true, isAdmin: false, agency: null };
    }
  };

  // Handle post-login admin verification and redirect
  useEffect(() => {
    const handlePostLoginFlow = async () => {
      if (waitingForUser && userLoaded && isSignedIn && user) {
        console.log('=== POST LOGIN FLOW STARTED ===');
        console.log('User ID:', user.id);
        console.log('Email:', user?.emailAddresses?.[0]?.emailAddress);
        
        setCheckingAdminStatus(true);
        
        try {
          // Wait a moment for the session to be fully established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check admin status with authentication
          const adminCheck = await checkAdminStatus(user);
          
          if (adminCheck.success && adminCheck.isAdmin) {
            console.log('✅ User is confirmed ADMIN - redirecting to dashboard');
            console.log('Agency info:', adminCheck.agency);
            
            // Store admin info temporarily for smooth transition
            sessionStorage.setItem('tempAdminData', JSON.stringify({
              userId: user.id,
              isAdmin: true,
              agency: adminCheck.agency,
              timestamp: Date.now()
            }));
            
            // Navigate to dashboard
            console.log('🚀 Navigating to admin dashboard...');
            navigate('/admin-dashboard');
            
          } else {
            console.log('❌ User is NOT an admin - showing error');
            setError('This email is not registered as an agency owner. Please create an agency account first or contact support if you believe this is an error.');
            setCurrentStep('email');
          }
          
        } catch (error) {
          console.error('❌ Admin verification failed:', error);
          setError('Failed to verify admin status. Please try again.');
          setCurrentStep('email');
        } finally {
          setCheckingAdminStatus(false);
          setWaitingForUser(false);
          setIsLoading(false);
        }
      }
    };

    handlePostLoginFlow();
  }, [waitingForUser, userLoaded, isSignedIn, user, navigate]);

  // UPDATED: Handle already signed-in users with authentication
  useEffect(() => {
    const checkExistingUser = async () => {
      if (isSignedIn && user && !waitingForUser && !checkingAdminStatus) {
        console.log('✅ User already signed in, checking admin status...');
        
        setCheckingAdminStatus(true);
        
        try {
          // Wait for session to be ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const adminCheck = await checkAdminStatus(user);
          
          if (adminCheck.success && adminCheck.isAdmin) {
            console.log('✅ Existing user is admin - redirecting to dashboard');
            navigate('/admin-dashboard');
          } else {
            console.log('❌ Existing user is not admin');
            setError('This account is not registered as an agency owner. Please sign up as an agency owner or sign in with a different account.');
          }
        } catch (error) {
          console.error('❌ Existing user admin check failed:', error);
          setError('Unable to verify admin status. Please try again.');
        } finally {
          setCheckingAdminStatus(false);
        }
      }
    };

    // Only check if not in the middle of login flow
    if (!waitingForUser) {
      checkExistingUser();
    }
  }, [isSignedIn, user, navigate, waitingForUser, checkingAdminStatus]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (isSignedIn) {
      setError('Please sign out of your current account first to login as admin.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📧 Sending verification email to:', email);
      
      await signIn.create({
        identifier: email.trim(),
      });

      const emailFirstFactor = signIn.supportedFirstFactors?.find(
        factor => factor.strategy === 'email_code'
      );

      if (emailFirstFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFirstFactor.emailAddressId
        });
        setCurrentStep('verification');
        console.log('✅ Verification email sent');
      } else {
        setError('Email verification not available. Please contact support.');
      }
    } catch (err) {
      console.error('❌ Email submission error:', err);
      
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('No account found with this email. Please check your email or sign up first.');
      } else if (err.errors?.[0]?.code === 'form_identifier_exists') {
        setError('Please check your email and try again.');
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
      console.log('🔐 Verifying code:', verificationCode);
      
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode.trim(),
      });

      if (result.status === 'complete') {
        console.log('✅ Email verification successful');
        
        // Set the active session
        await setActive({ session: result.createdSessionId });
        
        // Start the post-login flow with admin check
        setWaitingForUser(true);
        
      } else {
        console.log('❌ Verification incomplete:', result.status);
        setError('Email verification incomplete. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ Verification error:', err);
      
      if (err.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Invalid verification code. Please check and try again.');
      } else {
        setError(err.errors?.[0]?.message || 'Verification failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
      });
      console.log('✅ Verification code resent to:', email);
    } catch (err) {
      console.error('❌ Resend failed:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen for authentication checks
  if ((isSignedIn && user && checkingAdminStatus) || (waitingForUser || checkingAdminStatus)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 pt-24">
        <div className="max-w-md mx-auto px-5 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {waitingForUser ? 'Completing Login...' : 'Verifying Admin Access'}
              </h1>
              <p className="text-gray-600">
                {waitingForUser 
                  ? 'Verifying your agency owner status...'
                  : 'Checking your admin privileges...'
                }
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="animate-pulse text-emerald-600 text-center">
                  <div className="mb-2">🔐 Authenticating...</div>
                  <div className="text-sm">Please wait while we verify your admin access</div>
                </div>
              </div>
              
              {/* Emergency exit button */}
              <button
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
              >
                Cancel & Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 pt-24">
      <div className="max-w-md mx-auto px-5 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStep === 'email' ? 'Agency Owner Login' : 'Verify Your Email'}
            </h1>
            <p className="text-gray-600">
              {currentStep === 'email' 
                ? 'Enter your registered agency owner email'
                : `Enter the verification code sent to ${email}`
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-700 text-sm font-medium">Login Error</p>
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
                  placeholder="Enter your agency owner email"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the email address you registered your travel agency with
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
                    Sending Code...
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
                    Verifying Access...
                  </>
                ) : (
                  'Verify & Access Dashboard'
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

          <div className="mt-8 p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-emerald-800">Secure Agency Access</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Your login is protected with secure authentication. Only registered travel agency owners can access the admin dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an agency account?{' '}
              <Link to="/admin-signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Register your travel agency
              </Link>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Looking for customer login?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700">
                Customer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
