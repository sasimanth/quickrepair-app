import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold font-heading mb-6 border-b-4 border-blue-500 inline-block pb-2">About Us</h1>
        <p className="text-2xl text-gray-600 font-light">We believe a broken appliance shouldn't break your day.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-3xl font-semibold mb-6">Our Story</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Fixvo started with a simple, universal frustration: waiting days for a mechanic who never shows up, only to be hit with hidden charges when they finally do.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We built this platform to bring transparency, speed, and trust to the home repair industry. By connecting users directly with vetted, professional technicians via smart matching algorithms, we ensure your home gets the fastest, most reliable fix possible.
          </p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
           <h3 className="text-2xl font-semibold mb-4 text-blue-900">Our Mission</h3>
           <p className="text-blue-800 italic text-lg border-l-4 border-blue-400 pl-4">
             "To organize the fragmented repair market and restore convenience to modern households, one appliance at a time."
           </p>
        </div>
      </div>
      
      <div className="bg-white shadow-xl rounded-2xl p-10 mt-12 border border-gray-100">
        <h2 className="text-3xl font-semibold mb-8 text-center">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
             <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center text-green-600 mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h3 className="font-semibold text-xl mb-2">Lightning Fast</h3>
             <p className="text-gray-600 text-sm">We aim for under 2 hours for dispatch in major metropolitan areas.</p>
          </div>
          <div>
             <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center text-blue-600 mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
             </div>
             <h3 className="font-semibold text-xl mb-2">Vetted Experts</h3>
             <p className="text-gray-600 text-sm">Every technician passes a rigorous background check and skills test.</p>
          </div>
          <div>
             <div className="bg-purple-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center text-purple-600 mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
             </div>
             <h3 className="font-semibold text-xl mb-2">Transparent Pricing</h3>
             <p className="text-gray-600 text-sm">No hidden fees. You see the breakdown before the work begins.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
