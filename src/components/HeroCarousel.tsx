import React from "react";
import { Link } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  {
    title: "The Smarter Way To Create Timetables",
    subtitle:
      "Automated, AI-powered, conflict-free timetabling for universities and colleges.",
    image: "/images/hero1.jpg",
  },
  {
    title: "Optimise Rooms, Staff & Periods",
    subtitle: "Make the best use of resources and reduce clashes instantly.",
    image: "/images/hero2.jpg",
  },
  {
    title: "Collaborate With Faculty & Students",
    subtitle: "Share timetables, changes and announcements in real time.",
    image: "/images/hero3.jpg",
  },
];

const HeroCarousel: React.FC = () => {
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
                backgroundImage: `linear-gradient(rgba(37,99,235,0.85), rgba(37,99,235,0.85)), url('${s.image}')`,
              }}
              role="img"
              aria-label={s.title}
            >
              <div className="max-w-6xl mx-auto px-6 text-center">
                <div className="text-6xl mb-4">🚀</div>

                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
                  {s.title}
                </h1>

                <p className="mt-4 max-w-2xl mx-auto text-lg text-blue-100">
                  {s.subtitle}
                </p>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-full shadow hover:bg-gray-50 transition"
                  >
                    Get Started
                  </Link>

                  <Link
                    to="/about"
                    className="px-6 py-3 border border-white/30 rounded-full text-white hover:bg-white/10 transition"
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
