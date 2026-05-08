import React from "react";

const LoadingSkeleton: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <div className="w-10 h-10 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto absolute top-3 left-1/2 -ml-5" style={{ animationDirection: "reverse", animationDuration: "0.6s" }}></div>
      </div>
      <p className="mt-6 text-gray-500 font-medium animate-pulse">Loading…</p>
    </div>
  </div>
);

export default LoadingSkeleton;
