import React from 'react';

const HeroSection = () => {
  return (
    <section className="mt-20 py-16    ">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid md:grid-row-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h1 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
              Your trip, your budget, your call!
            </h1>
            <p className="text-lg mb-8 opacity-90 leading-relaxed">
              Escape to new heights, find what ignites from adventure regions with our unlimited vacations all over.
            </p>
            
          </div>
          <div className="order-1 md:order-2 text-center relative">
  {/* Escape title in blue */}
  <h2 className="text-4xl font-bold mb-4 text-blue-600">Escape</h2>
  
  {/* Subtitle text in single line */}
  <p className="text-base mb-6 opacity-90 whitespace-nowrap">
    Book your next journey with trusted local travel agencies
  </p>
  
  {/* World map container */}
  <div className="w-full h-72 relative mb-8 flex items-center justify-center">
    <img 
      src="/assets/worldmap.png" 
      alt="World Map" 
      className="w-full h-60 object-contain opacity-100"
    />
    
    {/* Traveler illustration positioned on the map */}
    <div className="absolute bottom-4 right-12 w-20 h-28 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm border border-white border-opacity-20 flex items-center justify-center">
      {/* Add traveler illustration here */}
    </div>
  </div>
  
  {/* Get Started button */}
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition-all duration-300 hover:shadow-md">
    Get Started
  </button>
</div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
