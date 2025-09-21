import React, { useState } from 'react';

const Cart = () => {
  // Sample cart data - replace with your state management solution (Redux, Context API, etc.)
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      packageName: "Ladakh Adventure Trek",
      destination: "Ladakh, India",
      duration: "7 days, 6 nights",
      price: 45000,
      agency: "MakeMyTrip",
      image: "/assets/ladakh.jpg", // Add your image path
      inclusions: ["Accommodation", "Meals", "Transportation", "Guide"],
      startDate: "2025-03-15",
      endDate: "2025-03-22",
      travelers: 2
    },
    {
      id: 2,
      packageName: "Kerala Backwaters Experience",
      destination: "Kerala, India",
      duration: "5 days, 4 nights",
      price: 28000,
      agency: "Yatra.com",
      image: "/assets/kerala.jpg", // Add your image path
      inclusions: ["Houseboat", "Meals", "Sightseeing", "Airport Transfer"],
      startDate: "2025-04-10",
      endDate: "2025-04-15",
      travelers: 2
    },
    {
      id: 3,
      packageName: "Goa Beach Holiday",
      destination: "Goa, India",
      duration: "4 days, 3 nights",
      price: 22000,
      agency: "Cleartrip",
      image: "/assets/goa.jpg", // Add your image path
      inclusions: ["Beach Resort", "Breakfast", "Water Sports", "Airport Transfer"],
      startDate: "2025-05-01",
      endDate: "2025-05-05",
      travelers: 2
    }
  ]);

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateTravelers = (itemId, newCount) => {
    setCartItems(cartItems.map(item => 
      item.id === itemId 
        ? { ...item, travelers: newCount, price: (item.price / item.travelers) * newCount }
        : item
    ));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Travel Cart</h1>
          <p className="text-lg text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'package' : 'packages'} selected
          </p>
        </div>

        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Start exploring amazing travel packages and add them to your cart!</p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Browse Packages
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="md:flex">
                    {/* Package Image */}
                    <div className="md:w-1/3">
                      <div className="w-full h-48 md:h-full bg-gradient-to-r from-blue-400 to-purple-500 relative">
                        {/* Add actual image here */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-30"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-4xl opacity-60">🏔️</span>
                        </div>
                      </div>
                    </div>

                    {/* Package Details */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{item.packageName}</h3>
                          <p className="text-gray-600 mb-1">📍 {item.destination}</p>
                          <p className="text-gray-600 mb-1">⏱️ {item.duration}</p>
                          <p className="text-blue-600 font-medium mb-2">🏢 {item.agency}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Travel Dates */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Travel Dates:</p>
                        <p className="font-medium">{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</p>
                      </div>

                      {/* Inclusions */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Inclusions:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.inclusions.map((inclusion, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                            >
                              {inclusion}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Travelers and Price */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Travelers:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateTravelers(item.id, Math.max(1, item.travelers - 1))}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="font-medium px-3">{item.travelers}</span>
                            <button
                              onClick={() => updateTravelers(item.id, item.travelers + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(item.price)}</p>
                          <p className="text-sm text-gray-500">for {item.travelers} {item.travelers === 1 ? 'person' : 'people'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-28">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.packageName}</span>
                      <span className="font-medium">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Including all taxes and fees</p>
                </div>

                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 mb-4">
                  Proceed to Checkout
                </button>

                <button className="w-full border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-medium py-3 px-6 rounded-lg transition-colors">
                  Continue Shopping
                </button>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-green-800">Free Cancellation</span>
                  </div>
                  <p className="text-sm text-green-700">Cancel up to 24 hours before your trip for a full refund</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
