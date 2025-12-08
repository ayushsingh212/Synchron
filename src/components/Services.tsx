import React from "react";

const serviceList = [
  {
    title: "Smart Sheduling",
    desc: "Auto-detects conflicts and suggests optimal replacements.",
  },
  {
    title: "Yield Results ",
    desc: "Focused on outcomes that matter.",
  },
  {
    title: "No Hassle",
    desc: " Smooth, simple and stress-free.",
  },
  {
    title: "Complete Automation",
    desc: "Reduce manual effort drastically",
  },
];

const Services: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-00 mb-10">
        Why Choose Us?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
        {serviceList.map((s) => (
          <div key={s.title} className="bg-blue-600 text-white rounded-xl p-6 shadow-md">
            <div className="h-12 w-12 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
              {s.title.charAt(0)}
            </div>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-White-200">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default React.memo(Services);
