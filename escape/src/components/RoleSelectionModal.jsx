
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RoleSelectionModal = ({ isOpen, onClose }) => {
  const [selectedRole, setSelectedRole] = useState(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to Escape</h2>
          <p className="text-blue-100">Choose how you'd like to continue</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedRole ? (
            // Role Selection Screen
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                I am a...
              </h3>

              <button
                onClick={() => handleRoleSelect('user')}
                className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Traveler / User</div>
                    <div className="text-sm text-gray-600">Book trips and explore packages</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('agency')}
                className="w-full p-4 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Agency Owner</div>
                    <div className="text-sm text-gray-600">Manage trips and bookings</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          ) : selectedRole === 'user' ? (
            // User Auth Options
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <button
                  onClick={handleBackToRoleSelection}
                  className="mr-3 p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-semibold text-gray-800">Welcome Traveler!</h3>
              </div>

              <p className="text-gray-600 text-center mb-6">
                Ready to discover amazing travel experiences?
              </p>

              <Link
                to="/signup"
                onClick={onClose}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Sign Up as User</span>
              </Link>

              <Link
                to="/login"
                onClick={onClose}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3v1" />
                </svg>
                <span>Login as User</span>
              </Link>
            </div>
          ) : (
            // Agency Auth Options
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <button
                  onClick={handleBackToRoleSelection}
                  className="mr-3 p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-semibold text-gray-800">Welcome Agency Owner!</h3>
              </div>

              <p className="text-gray-600 text-center mb-6">
                Start managing your travel business with us
              </p>

              <Link
                to="/admin-signup"
                onClick={onClose}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Register Your Agency</span>
              </Link>

              <Link
                to="/admin-login"
                onClick={onClose}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3v1" />
                </svg>
                <span>Login to Dashboard</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
