import React from "react";
import HeroCarousel from "../components/HeroCarousel";
import Tagline from "../components/Tagline";
import Services from "../components/Services";
import FeaturesIcons from "../components/FeaturesIcons";
import Testimonials from "../components/Testimonnials";
import LogosCloud from "../components/LogosCloud";


const Home: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col bg-blue-600 text-white">
      <HeroCarousel />

      <div className="bg-white">
        <Tagline />
        <Services />
        <FeaturesIcons />
        <Testimonials />
        {/* <LogosCloud /> */}
   
      </div>
    </main>
  );
};

export default Home;
