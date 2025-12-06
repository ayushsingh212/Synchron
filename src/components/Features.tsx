import React from "react";
import FeatureCard from "./FeatureCard";

const FEATURES = [
  {
    id: "fast",
    title: "Fast & Reliable",
    description: "Optimized AI timetabling with zero-lag performance.",
    iconColor: "#fff",
  },
  {
    id: "collab",
    title: "Collaboration",
    description: "Admins, faculty and students all stay connected.",
    iconColor: "#fff",
  },
  {
    id: "smart",
    title: "Smart Scheduling",
    description: "Auto-detects conflicts and generates optimal solutions.",
    iconColor: "#fff",
  },
  {
    id: "resources",
    title: "Resource Manager",
    description: "Subjects, rooms, faculty — all managed in one place.",
    iconColor: "#fff",
  },
];

const Features: React.FC = () => {
  return (
    <section className="bg-blue-600 text-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-14">Why Choose Us?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.id}
              title={f.title}
              description={f.description}
              iconColor={f.iconColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(Features);
