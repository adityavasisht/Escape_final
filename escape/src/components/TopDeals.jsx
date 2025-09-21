import React, { useState, useEffect } from 'react';

const TopDeals = () => {
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
      // Show only the top deal (best reviewed) if more than 3
      const bestReviewPackage = packages.reduce((best, current) => {
        if ((current.averageRating || 0) > (best?.averageRating || 0)) {
          return current;
        }
        return best;
      }, null);
      setDisplayPackages(bestReviewPackage ? [bestReviewPackage] : []);
    }
  }, [packages]);

  if (error) {
    return <div className="text-red-600 text-center my-4">{error}</div>;
  }

  if (!displayPackages.length) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-800 text-center">
          {packages.length <= 3 ? "Featured Packages" : "🏆 Top Deal"}
        </h2>
        <div className={`grid gap-8 ${displayPackages.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'max-w-md mx-auto'}`}>
          {displayPackages.map((package_) => (
            <div key={package_._id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer relative">
              {packages.length > 3 && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 text-sm font-bold rounded-full z-10">
                  🏆 BEST REVIEWED
                </div>
              )}

              <div className="w-full h-48 relative overflow-hidden">
                {package_.itineraryImages && package_.itineraryImages.length > 0 ? (
                  <img
                    src={package_.itineraryImages[0].url}
                    alt={package_.tripName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-4xl">📸</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-30"></div>
              </div>

              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{package_.tripName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  📍 {package_.locations?.join(' → ') || 'Multiple destinations'}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-emerald-600">
                    ₹{package_.totalBudget?.toLocaleString()}
                  </span>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">⭐</span>
                    <span className="text-sm font-medium">
                      {package_.averageRating?.toFixed(1) || 'New'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {package_.totalReviews || 0} reviews • {package_.currentBookings || 0} bookings
                </p>
                <button 
  onClick={() => window.location.href = `/trip/${package_._id}`}
  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-bold transition-colors"
>
  Book This Deal
</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDeals;
