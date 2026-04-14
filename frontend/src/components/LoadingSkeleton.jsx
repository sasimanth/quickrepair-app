import React from 'react';

const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <div className="w-full space-y-6 animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="h-10 bg-slate-200/60 rounded-lg w-1/4 mb-8"></div>
      
      {/* Content Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-48 bg-slate-200/60 rounded-2xl w-full border border-slate-100"></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
