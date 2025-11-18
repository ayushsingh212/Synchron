import React from "react";
import { FaBolt, FaUsers, FaCalendarAlt, FaBoxes } from "react-icons/fa";

const ICONS = [
  { id: "i1", icon: <FaBolt />, title: "Intuitive Options", desc: "Fast setup and clear UX." },
  { id: "i2", icon: <FaUsers />, title: "Collaboration", desc: "Role based access and sharing." },
  { id: "i3", icon: <FaCalendarAlt />, title: "Powerful Timetables", desc: "Conflict aware scheduling." },
  { id: "i4", icon: <FaBoxes />, title: "Manage Resources", desc: "Rooms, labs, and equipment." },
];

const FeaturesIcons: React.FC = () => (
  <section className="bg-white/60 py-8">
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {ICONS.map((it) => (
        <div key={it.id} className="flex items-start gap-4">
          <div className="text-2xl text-blue-600 bg-blue-50 p-3 rounded">{it.icon}</div>
          <div>
            <h4 className="font-semibold text-blue-600">{it.title}</h4>
            <p className="text-sm text-slate-500">{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default React.memo(FeaturesIcons);
