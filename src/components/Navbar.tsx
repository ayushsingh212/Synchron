import React from "react";

const Navbar: React.FC = () => {
  return (
    <header className="w-full bg-white text-blue-600 border-b border-blue-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
        <h1 className="text-xl md:text-2xl font-bold">Timetable Scheduler</h1>

        <nav>
          <ul className="flex gap-6 text-sm md:text-base font-semibold">
            <li>
              <a href="/about" className="hover:text-blue-500 transition">
                About
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-blue-500 transition">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default React.memo(Navbar);
