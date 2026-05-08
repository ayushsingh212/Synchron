
import React from "react";
import { Link } from "react-router-dom";
import { useOrganisation } from "../context/OrganisationContext";

const Hero: React.FC = () => {
  const { organisation } = useOrganisation();

  return (
    <section className="bg-blue-600 text-white py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 text-center">

       <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
          The Smarter Way To Create
          <br />
          <span className="text-slate-100">Timetables</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-200">
          Automated, AI-powered, conflict-free timetabling for universities and colleges.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          {organisation ? (
            <Link
              to="/dashboard/organisation-info"
             className="bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-green-900 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
           <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-login-modal"));
              }}
             className="bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-green-900 transition"
            >
              Get Started
            </button>
          )}
        </div>

      </div>
    </section>
  );
};

export default React.memo(Hero);
