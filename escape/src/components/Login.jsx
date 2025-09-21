
import React, { useState, useEffect } from 'react';
import { useSignIn, useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user, isSignedIn, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitingForUser, setWaitingForUser] = useState(false);

  // Handle user state changes after sign-in
  useEffect(() => {
    if (waitingForUser && userLoaded && isSignedIn && user) {
      console.log('=== USER LOGIN SUCCESS ===');
      console.log('User exists:', !!user);
      console.log('Email:', user?.emailAddresses?.[0]?.emailAddress);
      console.log('User Role:', user?.publicMetadata?.role);
      console.log('=============================');

      // Navigate based on user role
      if (user?.publicMetadata?.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/');
      }

      setWaitingForUser(false);
      setIsLoading(false);
    }
  }, [waitingForUser, userLoaded, isSignedIn, user, navigate]);

  // Check if already signed in
  useEffect(() => {
    if (isSignedIn && user && !waitingForUser) {
      if (user.publicMetadata?.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/');
      }
    }
  }, [isSignedIn, user, navigate, waitingForUser]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (isSignedIn) {
      setError('You are already signed in. Please sign out first if you want to login with a different account.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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
      } else {
        setError('Email verification not available for this account. Please try another method or contact support.');
      }
    } catch (err) {
      console.error('User email login error:', err);

      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('Account not found with this email. Please check your email or sign up first.');
      } else {
        setError(err.errors?.[0]?.message || 'Failed to send verification email. Please try again.');
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
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setWaitingForUser(true);
        // Don't set isLoading to false here - let useEffect handle it
      } else {
        setError('Login incomplete. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please check and try again.');
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
      console.log('Verification code resent to', email);
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24">
      <div className="max-w-md mx-auto px-5 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStep === 'email' ? 'Welcome Back' : waitingForUser ? 'Signing You In...' : 'Check Your Email'}
            </h1>
            <p className="text-gray-600">
              {currentStep === 'email' 
                ? 'Enter your email address to continue'
                : waitingForUser 
                ? 'Please wait while we complete your login...'
                : `We've sent a verification code to ${email}`
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Show loading state when waiting for user data */}
          {waitingForUser && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 text-sm">Completing your login...</p>
              </div>
            </div>
          )}

          {/* Step 1: Email Input */}
          {currentStep === 'email' && !waitingForUser && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="Enter your email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll send a verification code to this email address
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSignedIn || !email.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Email Verification */}
          {currentStep === 'verification' && !waitingForUser && (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Enter the 6-digit code we sent to <strong>{email}</strong>
                </p>
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
                {isLoading ? 'Verifying...' : 'Verify and Login'}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="flex-1 text-blue-600 hover:text-blue-700 py-2 text-sm"
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
                  className="flex-1 text-gray-600 hover:text-gray-700 py-2 text-sm"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Secure Email Verification</p>
                <p className="text-xs text-blue-700 mt-1">
                  We'll verify your identity by sending a secure code to your email address.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up here
              </Link>
            </p>
            <p className="text-gray-600 mt-2">
              Are you an agency owner?{' '}
              <Link to="/admin-login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
