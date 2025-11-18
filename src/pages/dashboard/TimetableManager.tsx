import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Manage timetables list. Provide filters for course/year and quick actions.
 * Production: integrate server-side pagination.
 */

const TimetableManager: React.FC = () => {
  const [course, setCourse] = useState("B.Tech");
  const [year, setYear] = useState("1");

  // mock list
  const lists = [
    { id: "btech-1-a", title: "B.Tech Year 1 - Section A" },
    { id: "btech-1-b", title: "B.Tech Year 1 - Section B" },
  ];

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-semibold">Timetables</h3>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="border px-2 py-1 rounded">
          <option>B.Tech</option>
          <option>M.Tech</option>
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="border px-2 py-1 rounded">
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
        </select>
      </div>

      <div className="grid gap-3">
        {lists.map((t) => (
          <div key={t.id} className="bg-white rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-slate-500">Generated: --</div>
            </div>
            <div className="flex gap-2">
              <Link to={`sectionTimeTable?tid=${t.id}`} className="px-3 py-1 border rounded">View</Link>
              <button className="px-3 py-1 border rounded">Export</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TimetableManager;
