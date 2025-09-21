
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const WelcomePopup = ({ onClose, isOpen }) => {
  const [selectedUserType, setSelectedUserType] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Welcome to Escape!</h2>
              <p className="text-blue-100 mt-1">Choose how you'd like to continue</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {!selectedUserType ? (
            // User Type Selection
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                I am a...
              </h3>

              <button
                onClick={() => setSelectedUserType('user')}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-gray-800">User</h4>
                    <p className="text-gray-600 text-sm">I want to book trips and explore destinations</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => setSelectedUserType('agency')}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-emerald-100 group-hover:bg-emerald-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-gray-800">Agency Owner</h4>
                    <p className="text-gray-600 text-sm">I want to list trips and manage my travel agency</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          ) : selectedUserType === 'user' ? (
            // User Options
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Customer Access</h3>
                <p className="text-gray-600 mt-1">Join as a customer to book amazing trips</p>
              </div>

              <Link
                to="/signup"
                onClick={onClose}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-center block transition-colors duration-200"
              >
                Sign Up
              </Link>

              <Link
                to="/login"
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 px-6 rounded-lg font-semibold text-center block transition-colors duration-200"
              >
                Login
              </Link>

              <button
                onClick={() => setSelectedUserType('')}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm"
              >
                ← Back to selection
              </button>
            </div>
          ) : (
            // Agency Options
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Agency Access</h3>
                <p className="text-gray-600 mt-1">Manage your travel agency and list trips</p>
              </div>

              <Link
                to="/admin-signup"
                onClick={onClose}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-6 rounded-lg font-semibold text-center block transition-colors duration-200"
              >
                Sign Up as Agency
              </Link>

              <Link
                to="/admin-login"
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 px-6 rounded-lg font-semibold text-center block transition-colors duration-200"
              >
                Login as Agency
              </Link>

              <button
                onClick={() => setSelectedUserType('')}
                className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm"
              >
                ← Back to selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
