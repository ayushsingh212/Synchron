import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CourseSelection = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState(["B.Tech", "M.Tech", "MCA"]);
  const [newCourse, setNewCourse] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const addCourse = () => {
    if (!newCourse.trim()) return;
    setCourses([...courses, newCourse]);
    setNewCourse("");
    setShowAddModal(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-600 mb-6">
        Select a Course
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c, i) => (
          <div
            key={i}
            onClick={() => navigate(`/dashboard/organisation-data-taker/${c}/years`)}
            className="cursor-pointer bg-white border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:bg-blue-50 transition"
          >
            <h3 className="text-lg font-semibold text-blue-600">{c}</h3>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        + Add New Course
      </button>

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-blue-600 mb-4">
              Add New Course
            </h3>

            <input
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Course Name (e.g., BBA)"
            />

            <button
              onClick={addCourse}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Add Course
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSelection;
