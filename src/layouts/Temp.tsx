import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatBotWidget from "../components/ChatBot";
import TimetableAccessWidget from "../components/faculty/TimeTableAccessWidget";

const Temp: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-brand-500 selection:text-white">
      <Navbar />

      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      
      <ChatBotWidget/>
      <TimetableAccessWidget/>
      <Footer />
    </div>
  );
};

export default Temp;
