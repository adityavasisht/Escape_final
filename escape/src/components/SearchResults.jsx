import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [minRating, setMinRating] = useState(0);

  const query = searchParams.get('query') || '';
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/trips/search?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        setTrips(data.trips || []);
        setFilteredTrips(data.trips || []);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setError('Failed to load search results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    }
  }, [query, API_BASE_URL]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = trips.filter(trip => {
      const matchesPrice = trip.totalBudget >= priceRange[0] && trip.totalBudget <= priceRange[1];
      const matchesRating = (trip.averageRating || 0) >= minRating;
      return matchesPrice && matchesRating;
    });

    // Apply sorting
    switch (sortBy) {
      case 'priceLowToHigh':
        filtered.sort((a, b) => (a.totalBudget || 0) - (b.totalBudget || 0));
        break;
      case 'priceHighToLow':
        filtered.sort((a, b) => (b.totalBudget || 0) - (a.totalBudget || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default: // relevance
        // Keep original order
        break;
    }

    setFilteredTrips(filtered);
  }, [trips, sortBy, priceRange, minRating]);

  const maxPrice = Math.max(...trips.map(trip => trip.totalBudget || 0), 100000);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600">Searching packages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
              <p className="text-gray-600 mt-1">
                {filteredTrips.length} packages found for "{query}"
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="priceLowToHigh">Price: Low to High</option>
                  <option value="priceHighToLow">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹0</span>
                  <span>₹{maxPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <div className="space-y-2">
                  {[4, 3, 2, 1, 0].map(rating => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={minRating === rating}
                        onChange={(e) => setMinRating(parseInt(e.target.value))}
                        className="mr-2"
                      />
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
                          >
                            ⭐
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {rating > 0 ? `${rating}+ stars` : 'Any rating'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSortBy('relevance');
                  setPriceRange([0, maxPrice]);
                  setMinRating(0);
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {filteredTrips.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.898-6-2.364" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg mb-4">No packages found matching your criteria</p>
                <button
                  onClick={() => {
                    setSortBy('relevance');
                    setPriceRange([0, maxPrice]);
                    setMinRating(0);
                  }}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  Clear filters to see more results
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredTrips.map(trip => (
                  <div
                    key={trip._id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(`/trip/${trip._id}`)}
                  >
                    <div className="md:flex">
                      {/* Image */}
                      <div className="md:w-80 h-48 md:h-auto flex-shrink-0">
                        {trip.itineraryImages && trip.itineraryImages.length > 0 ? (
                          <img
                            src={trip.itineraryImages[0].url}
                            alt={trip.tripName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white text-4xl">📸</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{trip.tripName}</h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-600">
                              ₹{trip.totalBudget?.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">per person</div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3">
                          📍 {trip.locations?.join(' → ') || 'Multiple destinations'}
                        </p>

                        {trip.description && (
                          <p className="text-gray-700 mb-4 line-clamp-2">{trip.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <span className="text-yellow-400 mr-1">⭐</span>
                              <span>{trip.averageRating?.toFixed(1) || 'New'}</span>
                              <span className="ml-1">({trip.totalReviews || 0} reviews)</span>
                            </div>
                            <div>👥 {trip.currentBookings || 0}/{trip.maxCapacity}</div>
                          </div>
                          
                          {trip.agencyName && (
                            <div className="text-sm text-gray-500">
                              by {trip.agencyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
