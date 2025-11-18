import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => (
  <section className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold">404 — Not Found</h1>
      <p className="text-slate-600 mt-2">The page you are looking for does not exist.</p>
      <Link to="/" className="inline-block mt-4 bg-brand-500 text-white px-4 py-2 rounded">Go Home</Link>
    </div>
  </section>
);

export default NotFound;
