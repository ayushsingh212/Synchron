import React from "react";

const Tagline: React.FC = () => {
  return (
    <div className="border-t border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8 text-center text-blue-600">
        <p className="text-lg md:text-xl">
          Contrary to popular belief, <span className="font-semibold">Timetable Scheduler</span> can produce optimized timetables in minutes — designed for
          universities and colleges.
        </p>
      </div>
    </div>
  );
};

export default React.memo(Tagline);
