import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const YearSelection = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-600 mb-4">
        {courseId} – Select Year
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {years.map((y, i) => (
          <div
            key={i}
            onClick={() =>
              navigate(`/dashboard/organisation-data-taker/${courseId}/${y}/data`)
            }
            className="cursor-pointer bg-white border border-blue-200 rounded-xl p-5 shadow-sm hover:bg-blue-50 hover:shadow-md transition"
          >
            <h3 className="text-lg text-blue-600 font-semibold">{y}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YearSelection;
