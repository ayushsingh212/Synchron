import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useParams } from "react-router-dom";
import TimeTableViewer from "./dashboard/TimTableViewer";

const VariantViewerPage: React.FC = () => {
  const { id } = useParams();
  const [variant, setVariant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"sections" | "faculty">("sections");

  const fetchVariant = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/timetable/solutions/${id}`, {
        withCredentials: true,
      });
     console.log("Here is the res",res.data.data)
      setVariant(res.data.data);
    } catch (err) {
      console.error("Error loading variant", err);
    }
  };

  useEffect(() => {
    fetchVariant();
  }, [id]);

  if (!variant) return <p>Loading...</p>;

  const { course, year, semester, sections, faculty } = variant;
   
  console.log("Here are the things",course,year,semester,sections)
  return (
    <div className="p-5">
      <h2 className="text-xl font-semibold mb-4">
        Variant Rank {variant.rank} – {course.toUpperCase()} / Year {year} / Sem {semester}
      </h2>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2 rounded ${activeTab === "sections" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Sections
        </button>
        <button
          onClick={() => setActiveTab("faculty")}
          className={`px-4 py-2 rounded ${activeTab === "faculty" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Faculty
        </button>
      </div>

      {activeTab === "sections" ? (
        <TimeTableViewer
          type="section"
          data={sections }
          course={course}
          year={year}
          semester={semester}
        />
      ) : (
        <TimeTableViewer
          type="faculty"
          data={faculty }
          course={course}
          year={year}
          semester={semester}
        />
      )}
    </div>
  );
};

export default VariantViewerPage;
