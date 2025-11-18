import React from "react";

/**
 * Faculty-specific timetable. Production: fetch by faculty id.
 */

const FacultyTimeTable: React.FC = () => {
  return (
    <section>
      <h3 className="font-semibold mb-3">Faculty Timetable</h3>
      <div className="bg-white p-4 rounded">
        <div className="text-slate-600">Select faculty to view timetable (TODO)</div>
      </div>
    </section>
  );
};

export default FacultyTimeTable;
