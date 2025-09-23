import React, { useEffect, useState } from 'react';

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use hero0-hero4 images from /public/assets
  const imageUrls = [
    '/assets/hero0.avif',
    '/assets/hero1.avif',
    '/assets/hero2.avif',
    '/assets/hero3.avif',
    '/assets/hero4.avif',
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
    }, 2000);
    return () => clearInterval(intervalId);
  }, [imageUrls.length]);

  return (
    <section className="mt-20 py-16 relative overflow-hidden h-[320px] md:h-[420px]">
      {/* Sliding background images */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="w-full h-full object-cover object-center flex-none"
              draggable={false}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      {/* Overlay for readability and visibility */}
      <div className="absolute inset-0 bg-black/20 z-0" />
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid md:grid-row-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h1 className="text-3xl md:text-5xl font-bold mb-5 leading-tight text-white">
              Your trip, your budget, your call!
            </h1>
            <p className="text-lg mb-8 leading-relaxed text-white/90">
              Escape to new heights, find what ignites from adventure regions with our unlimited vacations all over.
            </p>
            
          </div>
          <div className="order-1 md:order-2 text-center relative z-10">
  {/* Escape title in blue */}
  <h2 className="text-4xl font-bold mb-4 text-white">Escape</h2>
  
  {/* Subtitle text in single line */}
  <p className="text-base mb-6 whitespace-nowrap text-white/90">
    Book your next journey with trusted local travel agencies
  </p>
  
  {/* Spacer container to balance layout */}
  <div className="w-full h-48 md:h-56 relative mb-6 flex items-center justify-center">
    {/* Decorative card (optional) */}
    <div className="absolute bottom-2 right-8 w-20 h-24 bg-white/20 rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center">
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
