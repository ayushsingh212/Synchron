import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import axios from "axios";
import { useOrganisation } from "../../context/OrganisationContext";

const TimetableManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"sections" | "faculty">("sections");
  const [sectionTimetables, setSectionTimetables] = useState<any[]>([]);
  const [facultyTimetables, setFacultyTimetables] = useState<any[]>([]);
  const [apiResponse, setApiResponse] = useState(null)
  const list = activeTab === "sections" ? sectionTimetables : facultyTimetables;
  const {currentlyViewedTimtable,setCurrentlyViewedTimtable} = useOrganisation();
  const fetchAllSectionTimeTable = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/timetable/sections`, {
        withCredentials: true
      });

      const data = res.data.data;
      setApiResponse(data)
      const groups: any[] = [];

      Object.entries(data).forEach(([course, years]: any) => {
        Object.entries(years).forEach(([year, semesters]: any) => {
          Object.entries(semesters).forEach(([semester, sections]: any) => {
            groups.push({
              id: `${course}-${year}-${semester}`,
              course,
              year,
              semester,
              count: Object.keys(sections).length
            });
            setCurrentlyViewedTimtable([sections])
          });
        });
      });

      setSectionTimetables(groups);
    } catch (error) {
      console.log("Error fetching section timetables:", error);
    }
  };

  const fetchAllFacultyTimeTable = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/timetable/faculty`, {
        withCredentials: true
      });

      const data = res.data.data;
      setApiResponse(data)
      const groups: any[] = [];

      Object.entries(data).forEach(([course, years]: any) => {
        Object.entries(years).forEach(([year, semesters]: any) => {
          Object.entries(semesters).forEach(([semester, facultyObj]: any) => {
            groups.push({
              id: `${course}-${year}-${semester}`,
              course,
              year,
              semester,
              count: Object.keys(facultyObj).length
            });
          });
        });
      });

      setFacultyTimetables(groups);
    } catch (error) {
      console.log("Error fetching faculty timetables:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "sections") {
      fetchAllSectionTimeTable();
    } else {
      fetchAllFacultyTimeTable();
    }
  }, [activeTab]);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "sections"
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            Sections
          </button>

          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "faculty"
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            Faculty
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {list.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg p-4 border flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">
                {item.course.toUpperCase()} – Year {item.year} – Sem {item.semester}
              </div>

              <div className="text-sm text-slate-500">
                {item.count} {activeTab === "sections" ? "sections" : "faculty"} available
              </div>
            </div>

            <Link
              to={
                activeTab === "sections"
                  ? `/dashboard/sectionTimeTable/${item.course}/${item.year}/${item.semester}`
                  : `/dashboard/facultyTimeTable/${item.course}/${item.year}/${item.semester}`
              }
              className="px-4 py-2 border rounded-lg text-sm"
           
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TimetableManager;
