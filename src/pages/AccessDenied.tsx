import React from "react";
import { Link } from "react-router-dom";

const AccessDenied: React.FC = () => {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
        <p className="mb-6 text-slate-600">You must be logged in with the appropriate role to view this page.</p>
        <Link to="/" className="bg-brand-500 text-white px-4 py-2 rounded">Login</Link>
      </div>
    </section>
  );
};

export default AccessDenied;
