import React from "react";

const serviceList = [
  {
    title: "Fast & Reliable",
    desc: "Optimized AI timetabling with near real-time generation.",
  },
  {
    title: "Collaboration",
    desc: "Admins, faculty and students collaborate seamlessly.",
  },
  {
    title: "Smart Scheduling",
    desc: "Auto-detects conflicts and suggests optimal replacements.",
  },
  {
    title: "Resource Manager",
    desc: "Manage subjects, rooms, labs and faculty in one place.",
  },
];

const Services: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-600 mb-10">
        Why Choose Us?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {serviceList.map((s) => (
          <div key={s.title} className="bg-white text-blue-600 rounded-xl p-6 shadow-md">
            <div className="h-12 w-12 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
              {s.title.charAt(0)}
            </div>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default React.memo(Services);
