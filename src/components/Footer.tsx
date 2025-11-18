import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-blue-600 border-t border-blue-100">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-3">Timetable Scheduler</h3>
          <p className="text-sm text-slate-600">
            AI-powered timetable management for universities and colleges. Automate, optimise and share schedules with ease.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Documentation</li>
            <li>Help Center</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <p className="text-sm text-slate-600">timetablescheduler@gmail.com</p>
          <p className="text-sm text-slate-600 mt-2">+91 00000 00000</p>
        </div>
      </div>

      <div className="bg-white border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Timetable Scheduler. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
