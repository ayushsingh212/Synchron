import { useState, useRef, useEffect } from "react";
import { FiCalendar, FiX, FiUser, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function TimetableAccessWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"faculty" | "student" | "">("");
  const [organisationId, setorganisationId] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [value, setValue] = useState("");

  const modalRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const courseOptions = ["b.tech", "m.tech", "mca"];
  const yearOptions = ["1st year", "2nd year", "3rd year", "4th year"];
  const semesterOptions = ["sem 1", "sem 2", "sem 3", "sem 4", "sem 5", "sem 6", "sem 7", "sem 8"];

  const closeModal = () => {
    setOpen(false);
    setTimeout(() => {
      setMode("");
      setorganisationId("");
      setCourse("");
      setYear("");
      setSemester("");
      setValue("");
    }, 200);
  };

  const handleProceed = () => {
    if (!value.trim()) return;
    if (!organisationId || !course || !year || !semester) return;

    const c = course.toLowerCase().trim();
    const y = year.toLowerCase().trim();
    const s = semester.toLowerCase().trim();
    const id = value.trim();

    if (mode === "faculty") {
      navigate(`/facultyTimeTable/${c}/${y}/${s}/${id}`, {
        state: { organisationId, isBlocked: true }
      });
    } else {
      navigate(`/sectionTimeTable/${c}/${y}/${s}/${id}`, {
        state: { organisationId, isBlocked: true }
      });
    }

    closeModal();
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (open && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform"
      >
        <FiCalendar size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]">
          <div ref={modalRef} className="bg-white w-[90%] max-w-sm rounded-2xl shadow-xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-700">Access Your Timetable</h2>
              <button onClick={closeModal} className="text-gray-600 hover:text-red-500">
                <FiX size={20} />
              </button>
            </div>

            {mode === "" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setMode("faculty")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                >
                  <FiUser size={20} /> Proceed as Faculty
                </button>

                <button
                  onClick={() => setMode("student")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                >
                  <FiUsers size={20} /> Proceed as Student
                </button>
              </div>
            )}

            {mode !== "" && (
              <div className="mt-4 space-y-3">
                <input
                  value={organisationId}
                  onChange={(e) => setorganisationId(e.target.value)}
                  placeholder="OrganisationId"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />

                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Course</option>
                  {courseOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Year</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Semester</option>
                  {semesterOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={mode === "faculty" ? "Faculty ID" : "Section ID"}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                />

                <button
                  onClick={handleProceed}
                  disabled={!organisationId || !course || !year || !semester || !value.trim()}
                  className="w-full mt-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-300"
                >
                  View Timetable
                </button>

                <button
                  onClick={() => {
                    setMode("");
                    setorganisationId("");
                    setCourse("");
                    setYear("");
                    setSemester("");
                    setValue("");
                  }}
                  className="w-full mt-3 text-blue-600 hover:underline text-sm"
                >
                  ← Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
