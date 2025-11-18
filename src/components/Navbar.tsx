import React, { useState, useEffect } from "react";
import RegisterModal from "./RegisterModal";
import LoginModal from "./LoginModal";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const openRegister = () => {
      setShowLogin(false);
      setShowRegister(true);
    };

    const openLogin = () => {
      setShowRegister(false);
      setShowLogin(true);
    };

    window.addEventListener("open-register-modal", openRegister);
    window.addEventListener("open-login-modal", openLogin);

    return () => {
      window.removeEventListener("open-register-modal", openRegister);
      window.removeEventListener("open-login-modal", openLogin);
    };
  }, []);

  return (
    <>
      <header className="w-full bg-white text-blue-600 border-b border-blue-200 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            <Link to={"/"}>
             Timetable Scheduler
            </Link>
           
          </h1>

          <nav className="flex items-center gap-6 text-sm md:text-base font-semibold">
            <a href="/about" className="hover:text-blue-500 transition">About</a>
            <a href="/contact" className="hover:text-blue-500 transition">Contact</a>

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
          </nav>
        </div>
      </header>

      <RegisterModal open={showRegister} onClose={() => setShowRegister(false)} />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default React.memo(Navbar);
