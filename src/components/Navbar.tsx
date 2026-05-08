import React, { useState, useEffect } from "react";
import RegisterModal from "./RegisterModal";
import LoginModal from "./LoginModal";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useOrganisation } from "../context/OrganisationContext";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";

const Navbar: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { organisation, getOrganisation, setOrganisation } = useOrganisation();

  useEffect(() => {
    getOrganisation();

    const openRegister = () => {
      setShowLogin(false);
      setShowRegister(true);
    };

    const openLogin = () => {
      setShowRegister(false);
      setShowLogin(true);
    };
    const closeBoth = () => {
      setShowLogin(false);
      setShowRegister(false);
    };

    window.addEventListener("open-register-modal", openRegister);
    window.addEventListener("open-login-modal", openLogin);
    window.addEventListener("close-both-modal", closeBoth);

    return () => {
      window.removeEventListener("open-register-modal", openRegister);
      window.removeEventListener("open-login-modal", openLogin);
      window.removeEventListener("close-both-modal", closeBoth);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/organisation/logout`, {}, { withCredentials: true });
      setOrganisation(null);
      setMobileOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const goToDashboard = () => {
    setMobileOpen(false);
    organisation?.role === "authority"
      ? navigate("/authority-dashboard/management-panel")
      : navigate("/dashboard/organisation-info");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass text-slate-800 transition-all duration-300 border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-brand-600 font-display">
            <Link to={"/"} className="flex items-center gap-2">
              <span className="bg-brand-100 text-brand-600 p-1 rounded-lg"><LayoutDashboard size={20} /></span>
              SchedulifyAI
            </Link>
          </h1>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm md:text-base font-semibold">
            {organisation ? (
              <>
                <button
                  onClick={goToDashboard}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors duration-300"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                >
                  Register
                </button>
              </>
            )}
          </nav>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl animate-in slide-in-from-top duration-300 shadow-glass">
            <nav className="flex flex-col gap-2 px-6 py-4">
              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition font-medium"
              >
                About
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition font-medium"
              >
                Contact
              </Link>

              <div className="border-t border-slate-100 my-2"></div>

              {organisation ? (
                <>
                  <button
                    onClick={goToDashboard}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition font-semibold"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition font-semibold"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setShowLogin(true);
                    }}
                    className="px-4 py-3 rounded-xl text-brand-600 border border-brand-200 hover:bg-brand-50 transition font-semibold text-center"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setShowRegister(true);
                    }}
                    className="px-4 py-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition font-semibold text-center"
                  >
                    Register
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <RegisterModal open={showRegister} onClose={() => setShowRegister(false)} />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default React.memo(Navbar);