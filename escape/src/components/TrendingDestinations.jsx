import React, { useState, useEffect } from 'react';

const TrendingDestinations = () => {
  const [packages, setPackages] = useState([]);
  const [displayPackages, setDisplayPackages] = useState([]);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trips/public`);
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const data = await response.json();
        setPackages(data.packages || []);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchPackages();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (packages.length <= 3) {
      // Show all packages if 3 or fewer
      setDisplayPackages(packages);
    } else {
      // Show top 3 trending (most booked) if more than 3
      const trendingPackages = [...packages]
        .sort((a, b) => (b.currentBookings || 0) - (a.currentBookings || 0))
        .slice(0, 3);
      setDisplayPackages(trendingPackages);
    }
  }, [packages]);

  if (error) {
    return <div className="text-red-600 text-center my-4">{error}</div>;
  }

  if (!displayPackages.length) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-800 text-center">
          {packages.length <= 3 ? "Available Destinations" : "🔥 Trending Destinations"}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPackages.map((package_, index) => (
            <div key={package_._id} className="text-center group cursor-pointer">
              <div className="relative">
                {packages.length > 3 && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs font-bold rounded-full z-10">
                    🔥 #{index + 1}
                  </div>
                )}

                <div className="w-full h-44 rounded-xl mb-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-card">
                  {package_.itineraryImages && package_.itineraryImages.length > 0 ? (
                    <img
                      src={package_.itineraryImages[0].url}
                      alt={package_.tripName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-3xl">🏔️</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-20"></div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-800 group-hover:text-blue-500 transition-colors duration-200 mb-2">
                {package_.tripName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                📍 {package_.locations?.join(', ') || 'Multiple destinations'}
              </p>
              <div className="flex justify-center items-center gap-4 text-sm text-gray-600 mb-3">
                <span>⭐ {package_.averageRating?.toFixed(1) || 'New'}</span>
                <span>📊 {package_.currentBookings || 0} bookings</span>
              </div>
              <div className="text-lg font-bold text-emerald-600 mb-3">
                ₹{package_.totalBudget?.toLocaleString()}
              </div>
              <button 
                onClick={() => window.location.href = `/trip/${package_._id}`}
                className="btn-outline-light px-5 h-11 rounded-md font-medium"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingDestinations;
