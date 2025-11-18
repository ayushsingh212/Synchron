import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import axios from "axios";
import { API_BASE_URL } from "../config";

const slides = [
  {
    title: "The Smarter Way To Create Timetables",
    subtitle:
      "Automated, AI-powered, conflict-free timetabling for universities and colleges.",
    image: "./img1.jpg",
  },
  {
    title: "Optimise Rooms, Staff & Periods",
    subtitle: "Make the best use of resources and reduce clashes instantly.",
    image: "./img2.jpg",
  },
  {
    title: "Collaborate With Faculty & Students",
    subtitle: "Share timetables, changes and announcements in real time.",
    image: "./img3.jpg",
  },
];

const HeroCarousel: React.FC = () => {
    const [logined, setLogined] = useState(false);
  
    const checkUserLoggedIn = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/organisation/getCurrentOrganisation`,
        { withCredentials: true }
      );
      console.log("User logged in:", res.data);
      setLogined(true);
    } catch (error) {
      console.log("User not logged in:", error);
      setLogined(false);
    }
  };

  useEffect(() => {
    checkUserLoggedIn();
  }, []);
  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop
        className="h-[66vh]"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={i}>
            <div
              className="h-[66vh] w-full bg-center bg-cover flex items-center"
              style={{
                backgroundImage: ` url('${s.image}')`,
              }}
              role="img"
              aria-label={s.title}
            >
              <div className="max-w-6xl mx-auto px-6 text-center">
                <div className="text-6xl mb-4">🚀</div>

                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-blue-600">
                  {s.title}
                </h1>

                <p className="mt-4 max-w-2xl mx-auto text-lg text-blue-500">
                  {s.subtitle}
                </p>

                <div className="mt-8 flex items-center justify-center gap-4">
                    {logined ? (
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

                  <Link
                    to="/about"
                    className="px-6 py-3 border bg-blue-600 border-white/30 rounded-full text-white hover:bg-blue-950 transition"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default React.memo(HeroCarousel);
