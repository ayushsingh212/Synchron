import React, { useState } from "react";
import { useParams } from "react-router-dom";

const AcademicDataPage = () => {
  const { courseId, year } = useParams();

  const [subjects, setSubjects] = useState([""]);
  const [faculty, setFaculty] = useState([""]);
  const [classrooms, setClassrooms] = useState([""]);
  const [departments, setDepartments] = useState([""]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-blue-600 mb-4">
        {courseId} • {year} • Academic Data
      </h2>

      <div className="space-y-6">

        <div>
          <label className="font-medium text-slate-600">Subjects</label>
          <textarea className="w-full border border-blue-200 rounded-lg p-2 mt-1" />
        </div>

        <div>
          <label className="font-medium text-slate-600">Faculty</label>
          <textarea className="w-full border border-blue-200 rounded-lg p-2 mt-1" />
        </div>

        <div>
          <label className="font-medium text-slate-600">Classrooms</label>
          <textarea className="w-full border border-blue-200 rounded-lg p-2 mt-1" />
        </div>

        <div>
          <label className="font-medium text-slate-600">Departments</label>
          <textarea className="w-full border border-blue-200 rounded-lg p-2 mt-1" />
        </div>

        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Save Data
        </button>
      </div>
    </div>
  );
};

export default AcademicDataPage;
