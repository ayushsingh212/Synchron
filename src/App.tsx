import React, { Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
        <Home />
      </Suspense>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
