import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const YearSelection: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

  // Define years per course - use lowercase keys for consistency
  const courseYearsMap: Record<string, string[]> = {
    "b.tech": ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    "m.tech": ["1st Year", "2nd Year"],
    "mca": ["1st Year", "2nd Year", "3rd Year"],
  };

  // Normalize the courseId to match the map keys (case-insensitive)
  const normalizedCourseId = courseId?.toLowerCase().trim() || "";
  const years = courseYearsMap[normalizedCourseId] || [];
  const [selectedYear, setSelectedYear] = useState<string>("");

  const getSemesters = (year: string) => {
    const index = years.indexOf(year);
    return [`Sem ${index * 2 + 1}`, `Sem ${index * 2 + 2}`];
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-600 mb-4">
        {courseId} – Select Year
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {years.map((y) => (
          <div
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`cursor-pointer bg-white border rounded-xl p-5 shadow-sm transition 
              ${
                selectedYear === y
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-blue-200 hover:bg-blue-50 hover:shadow-md"
              }`}
          >
            <h3 className="text-lg text-blue-600 font-semibold">{y}</h3>
          </div>
        ))}
      </div>

      {selectedYear && (
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-3">
            Select Semester ({selectedYear})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            {getSemesters(selectedYear).map((sem) => (
              <div
                key={sem}
                onClick={() =>
                  navigate(
                    `/dashboard/organisation-data-taker/${courseId}/${selectedYear}/${sem}/data`
                  )
                }
                className="cursor-pointer bg-white border border-blue-200 rounded-xl p-5 shadow-sm hover:bg-blue-50 hover:shadow-md transition"
              >
                <h3 className="text-lg text-blue-600 font-semibold">{sem}</h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YearSelection;