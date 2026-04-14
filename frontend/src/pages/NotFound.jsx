import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl text-center flex-grow flex flex-col items-center justify-center">
      <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-3xl font-heading font-semibold mb-4 text-gray-800">Oops! This page is broken.</h2>
      <p className="text-xl text-gray-500 mb-8 max-w-lg mx-auto">
        We fix appliances, but we couldn't fix this link. Don't worry, let's get you back to safety.
      </p>
      <Link 
        to="/" 
        className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
