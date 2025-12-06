import React, { useState, useEffect } from "react";
import RegisterModal from "./RegisterModal";
import LoginModal from "./LoginModal";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useOrganisation } from "../context/OrganisationContext";

const Navbar: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
    const { organisation,getOrganisation,setOrganisation } = useOrganisation();


  useEffect(() => {
     getOrganisation()

    const openRegister = () => {
      setShowLogin(false);
      setShowRegister(true);
    };

    const openLogin = () => {
      setShowRegister(false);
      setShowLogin(true);
    };
    const closeBoth = ()=>{
      setShowLogin(false);
      setShowRegister(false)
    }

    window.addEventListener("open-register-modal", openRegister);
    window.addEventListener("open-login-modal", openLogin);
    window.addEventListener("close-both-modal", closeBoth);

    return () => {
      window.removeEventListener("open-register-modal", openRegister);
      window.removeEventListener("open-login-modal", openLogin);
      window.removeEventListener("close-both-modal", closeBoth);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/organisation/logout`, {}, { withCredentials: true });
      setOrganisation(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <header className="w-full bg-gradient-to-r from-blue-50 via-white to-blue-50 text-blue-600 border-b border-blue-200 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            <Link to={"/"}>SchedulifyAI</Link>
          </h1>

          <nav className="flex items-center gap-6 text-sm md:text-base font-semibold">
            {organisation ? (
              <>
                <Link
                  to="/dashboard/organisation-info"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-blue-600 border border-blue-500 hover:bg-blue-50 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 rounded-lg text-blue-600 border border-blue-500 hover:bg-blue-50 transition"
                >
                  Login
                </button>

                <button
                  onClick={() => setShowRegister(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Register
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <RegisterModal open={showRegister} onClose={() => setShowRegister(false)} />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default React.memo(Navbar);