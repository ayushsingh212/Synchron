import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import axios from "axios";
import { useOrganisation } from "../../context/OrganisationContext";

// Assuming you have an icon library like Heroicons or FontAwesome available
// If not, you can use a simple text or emoji for the delete button.
// For this example, we'll use a simple SVG icon.
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 1.942a2.25 2.25 0 00-2.244-1.922H8.408a2.25 2.25 0 00-2.244 1.922L4.66 5.828m1.517 7.55L5.757 14.5m1.518-7.55h11.458a2.25 2.25 0 012.244 2.25v.074a2.25 2.25 0 01-2.25 2.25H4.25a2.25 2.25 0 01-2.25-2.25v-.074a2.25 2.25 0 012.244-2.25h11.458z" />
  </svg>
);


const TimetableManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"sections" | "faculty">("sections");
  const [sectionTimetables, setSectionTimetables] = useState<any[]>([]);
  const [facultyTimetables, setFacultyTimetables] = useState<any[]>([]);
  const [apiResponse, setApiResponse] = useState(null)
  const list = activeTab === "sections" ? sectionTimetables : facultyTimetables;
  const { currentlyViewedTimtable, setCurrentlyViewedTimtable } = useOrganisation();

  // --- Fetching Functions ---
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

  const deleteTimetableGroup = async (course: string, year: string, semester: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to DELETE the entire timetable group for ${course}, Year ${year}, Semester ${semester}? This action is irreversible.`
    );

    if (!isConfirmed) return;

    try {
     const deleteUrl = `${API_BASE_URL}/timetable/${course}/${year}/${semester}`;
      
      const res = await axios.delete(deleteUrl, {
        withCredentials: true
      });

      if (res.status === 200 || res.status === 204) {
        alert(`Timetable group deleted successfully!`);
        
        
        if (activeTab === "sections") {
          fetchAllSectionTimeTable();
        } else {
          fetchAllFacultyTimeTable();
        }
      } else {
        alert(`Failed to delete timetable: ${res.data.message || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error("Error deleting timetable:", error);
      alert(`Error deleting timetable: ${error.response?.data?.message || error.message}`);
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
        
        <Link to="/dashboard/organisation-data-course" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
          + Create New
        </Link>
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

            <div className="flex gap-3 items-center">
              
              <Link
                to={
                  activeTab === "sections"
                    ? `/dashboard/sectionTimeTable/${item.course}/${item.year}/${item.semester}`
                    : `/dashboard/facultyTimeTable/${item.course}/${item.year}/${item.semester}`
                }
                className="px-4 py-2 border rounded-lg text-sm bg-blue-50 hover:bg-blue-100 transition duration-150"
              >
                View
              </Link>
              
              
              <button
                onClick={() => deleteTimetableGroup(item.course, item.year, item.semester)}
                className="p-2 border border-red-500 rounded-lg text-red-500 hover:bg-red-50 transition duration-150"
                title={`Delete ${item.course} Year ${item.year} Sem ${item.semester} timetables`}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TimetableManager;