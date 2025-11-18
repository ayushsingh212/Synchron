import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import axios from "axios";

const TimetableManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"sections" | "faculty">("sections");
  const [course, setCourse] = useState("B.Tech");
  const [year, setYear] = useState("1");
  const [sectionTimetables, setSectionTimetables] = useState([]);
  const [facultyTimetables, setFacultyTimetables] = useState([])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const sectionTimetables = [
  //   { id: "btech-1-a", title: "B.Tech Year 1 - Section A" },
  //   { id: "btech-1-b", title: "B.Tech Year 1 - Section B" },
  // ];

  // const facultyTimetables = [
  //   { id: "f-001", title: "Dr. A — B.Tech Year 1" },
  //   { id: "f-002", title: "Prof. B — B.Tech Year 1"},
  // ];

  const list = activeTab === "sections" ? sectionTimetables : facultyTimetables;
  const fetchAllSectionTimeTable = async()=>{

  try {
    const res = await axios.get(`${API_BASE_URL}/timetable/sections`,{
      withCredentials:true
    })
    console.log("Here is the response",res)
  } catch (error) {
    console.log("Error occured while fetching the section timetable",error)
  }
  }
  useEffect(()=>{
  

  fetchAllSectionTimeTable()



  },[])
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

        <div className="flex items-center gap-3">
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option>B.Tech</option>
            <option>M.Tech</option>
            <option>MCA</option>
            <option>BCA</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        {list.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-lg p-4 border flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{t.title}</div>
              <div className="text-sm text-slate-500">Generated: --</div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`sectionTimeTable?tid=${t.id}&type=${activeTab}`}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                View
              </Link>
              <button className="px-4 py-2 border rounded-lg text-sm">
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TimetableManager;
