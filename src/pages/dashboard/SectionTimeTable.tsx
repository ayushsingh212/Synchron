import React from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Show section-level timetable. Expects query param ?tid=...
 * In production: fetch by timetable id
 */

const SectionTimeTable: React.FC = () => {
  const [q] = useSearchParams();
  const tid = q.get("tid");

  if (!tid) {
    return <div className="text-slate-600">No timetable selected. Choose a timetable first.</div>;
  }

  return (
    <section>
      <h3 className="font-semibold mb-3">Section Timetable — {tid}</h3>
      <div className="overflow-auto bg-white p-4 rounded">
        {/* Mock timetable grid */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Time</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className="py-2">0{i + 8}:00</td>
                <td className="py-2">Subject</td>
                <td className="py-2">Subject</td>
                <td className="py-2">Subject</td>
                <td className="py-2">Subject</td>
                <td className="py-2">Subject</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SectionTimeTable;
