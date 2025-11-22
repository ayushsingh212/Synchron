import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatBotWidget from "../components/ChatBot";

const Temp: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>
      <ChatBotWidget/>
      <Footer />
    </div>
  );
};

export default Temp;
