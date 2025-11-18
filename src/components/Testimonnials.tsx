import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const testimonials = [
  { name: "Dr. A. Sharma", role: "HOD, CSE", text: "Timetable Scheduler saved us weeks of work. Auto conflict resolution is superb." },
  { name: "Prof. R. Gupta", role: "Principal", text: "Easy to manage faculty assignments and rooms. Very reliable." },
  { name: "Ms. P. Rao", role: "Admin", text: "Simple UI and excellent export features. Students love it too." },
];

const Testimonials: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h3 className="text-2xl font-semibold text-center text-blue-600 mb-6">What institutions say</h3>

      <Swiper slidesPerView={1} loop autoplay={{ delay: 4000 }}>
        {testimonials.map((t, i) => (
          <SwiperSlide key={i}>
            <div className="bg-white text-blue-600 rounded-lg p-8 shadow-md max-w-3xl mx-auto">
              <p className="text-slate-700 italic">“{t.text}”</p>
              <div className="mt-4 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-slate-500">{t.role}</div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default React.memo(Testimonials);
