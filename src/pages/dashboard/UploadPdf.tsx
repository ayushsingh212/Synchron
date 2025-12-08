import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Loader2,
  UploadCloud,
  Check,
  FileText,
  XCircle,
  Copy,
  Download,
  ArrowRightCircle,
} from "lucide-react";
import { API_BASE_URL, MODEL_BASE_URL, useAppState } from "../../config";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const UploadPdf = () => {
    const {courseId,year,semester} = useParams()
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [done, setDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // drag hover state
  const { hasOrganisationData, setHasOrganisationData } = useAppState()
  const fileInputRef = useRef();

  // Function to transform parsed time slots to match the manual editor structure
  const transformTimeSlotsForManualEditor = (parsedTimeSlots) => {
    console.log("Transforming time slots:", parsedTimeSlots);
    
    if (!parsedTimeSlots) {
      return {
        periods: [],
        working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        break_periods: [],
        lunch_period: null,
        start_time: "09:00",
        end_time: "17:00",
        periodCount: 0,
        periodDuration: 45,
        shortBreak: 10,
        lunchBreak: 45,
        shortBreakAfter: 2,
        lunchBreakAfter: 4,
        generatedSchedule: []
      };
    }

    const periods = parsedTimeSlots.periods || [];
    const working_days = parsedTimeSlots.working_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    
    if (periods.length === 0) {
      return {
        periods: [],
        working_days,
        break_periods: [],
        lunch_period: null,
        start_time: "09:00",
        end_time: "17:00",
        periodCount: 0,
        periodDuration: 45,
        shortBreak: 10,
        lunchBreak: 45,
        shortBreakAfter: 2,
        lunchBreakAfter: 4,
        generatedSchedule: []
      };
    }

    // Calculate period duration in minutes
    const calculateDuration = (start, end) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    };

    // Get start and end times
    const start_time = periods[0]?.start_time || "09:00";
    const end_time = periods[periods.length - 1]?.end_time || "17:00";
    
    // Calculate average period duration
    let totalDuration = 0;
    periods.forEach(period => {
      totalDuration += calculateDuration(period.start_time, period.end_time);
    });
    const periodDuration = Math.round(totalDuration / periods.length);
    
    // Create generatedSchedule with proper structure
    const generatedSchedule = periods.map((period, index) => {
      const duration = calculateDuration(period.start_time, period.end_time);
      const id = period.id || index + 1;
      
      // Try to identify breaks based on duration
      let type = "period";
      if (duration < 20) {
        type = "shortBreak";
      } else if (duration > 30 && duration < 60) {
        // Could be lunch break
        type = "lunchBreak";
      }
      
      return {
        id: id,
        type: type,
        start_time: period.start_time,
        end_time: period.end_time,
        duration: duration
      };
    });

    // Identify break periods
    const breakPeriodsIndices = generatedSchedule
      .filter(slot => slot.type === "shortBreak")
      .map(slot => slot.id);
    
    const lunchPeriodIndex = generatedSchedule.find(slot => slot.type === "lunchBreak")?.id || null;

    // Update periods with types
    const periodsWithTypes = generatedSchedule.map(slot => ({
      id: slot.id,
      type: slot.type,
      start_time: slot.start_time,
      end_time: slot.end_time
    }));

    // Determine break positions (find first teaching period before a break)
    let shortBreakAfter = 2;
    let lunchBreakAfter = 4;
    
    if (breakPeriodsIndices.length > 0) {
      const firstShortBreakId = Math.min(...breakPeriodsIndices);
      shortBreakAfter = firstShortBreakId - 1;
    }
    
    if (lunchPeriodIndex) {
      lunchBreakAfter = lunchPeriodIndex - 1;
    } else if (periods.length > 6) {
      lunchBreakAfter = Math.floor(periods.length / 2);
    }

    return {
      periods: periodsWithTypes,
      working_days,
      break_periods: breakPeriodsIndices,
      lunch_period: lunchPeriodIndex,
      start_time,
      end_time,
      periodCount: periods.length,
      periodDuration,
      shortBreak: 10,
      lunchBreak: 45,
      shortBreakAfter,
      lunchBreakAfter,
      generatedSchedule
    };
  };

  // Transform the entire parsed result for the manual editor
  const transformParsedResult = (parsedResult) => {
    if (!parsedResult) return parsedResult;
    
    const transformed = {
      ...parsedResult,
      time_slots: transformTimeSlotsForManualEditor(parsedResult.time_slots)
    };
    
    console.log("Transformed result:", transformed);
    return transformed;
  };

  // handle file selection
  const handleFileChange = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.type !== "application/pdf") {
      toast.error("Please upload a PDF file only.");
      return;
    }
    setFile(picked);
    setResult(null);
    setDone(false);
  };

  // handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const picked = e.dataTransfer.files?.[0];
    if (!picked) return;
    if (picked.type !== "application/pdf") {
      toast.error("Please upload a PDF file only.");
      return;
    }
    setFile(picked);
    setResult(null);
    setDone(false);
  };

  // handle upload
  const handleUpload = async (e) => {
    e && e.preventDefault();
    if (!file) {
      toast.warn("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setResult(null);
      setDone(false);

      const res = await axios.post(
        `${MODEL_BASE_URL}/parse-timetable`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
          timeout: 120000,
        }
      );

      const parsed = res?.data?.data;
      if (!parsed) {
        toast.error(
          "Parsing returned no data. Please check the PDF or try again."
        );
        return;
      }

      // Transform the parsed result immediately
      const transformedResult = transformParsedResult(parsed);
      setResult(transformedResult);
      setDone(true);
      toast.success("PDF parsed successfully — please verify the data below.");
      console.log("Original parsed:", parsed);
      console.log("Transformed for editor:", transformedResult);
    } catch (error) {
      console.error("Upload/parse error:", error);
      toast.error("Failed to parse PDF. Try again or upload a different file.");
    } finally {
      setUploading(false);
    }
  };

  // save parsed JSON
  const handleSave = async (e) => {
    e && e.preventDefault();
    if (!result) {
      toast.error("No parsed result to save. Upload a PDF first.");
      return;
    }

    try {
      setSaving(true);

      // Ensure result is transformed before saving
      const dataToSave = transformParsedResult(result);
      
      if (!dataToSave.college_info && !dataToSave.time_slots) {
        toast.warn(
          "Parsed data looks suspicious — check the preview before saving."
        );
      }

      console.log("Saving transformed data:", dataToSave);

      const res = await axios.post(
        `${API_BASE_URL}/timetable/saveData?course=${courseId}&year=${year}&semester=${semester}`,
        dataToSave,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 60000,
        }
      );
      setHasOrganisationData(true)
      toast.success("Saved to database successfully!");

      setTimeout(() => {
        navigate(`/dashboard/organisation-data-taker/${courseId}/${year}/${semester}/data`);
      }, 900);
    } catch (error) {
      console.error("Saving error:", error);
      toast.error("Saving to database failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // copy JSON to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success("Copied JSON to clipboard");
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  // download JSON
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name?.replace(/\.pdf$/i, "") || "timetable"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // reset everything
  const handleReset = () => {
    setFile(null);
    setResult(null);
    setDone(false);
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-3xl p-8 border border-gray-200">
           <div className="bg-blue-600 text-white p-4 rounded-b-xl shadow mb-6">
        <h2 className="text-xl font-semibold">
          Academic Data for Course: <span className="text-yellow-300">{courseId || "N/A"}</span>
        </h2>
        <p className="text-sm opacity-90">
          Year: <span className="text-yellow-200 font-medium">{year || "N/A"}</span>
        </p>
         <p className="text-sm opacity-90">
          Semester: <span className="text-yellow-200 font-medium">{semester || "N/A"}</span>
        </p>
      </div>
        <div className="flex items-center justify-between mb-6">
          
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">
              Upload Organisation Details (PDF)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload a timetable PDF — we'll attempt to parse it into structured
              data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/dashboard/organisation-data-taker/${courseId}/${year}/${semester}/data`}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              <FileText className="w-4 h-4" />
              Manual Editor
            </Link>
          </div>
        </div>

        {/* Upload area */}
        <form onSubmit={handleUpload} className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-xl cursor-pointer transition 
              ${isDragging
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : "border-gray-300"
              }
            `}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <div className="flex items-center gap-3">
              <UploadCloud
                className={`w-10 h-10 transition ${isDragging ? "text-blue-600 animate-bounce" : "text-blue-500"
                  }`}
              />
              <div className="text-left">
                <p className="font-medium text-gray-800">
                  {isDragging
                    ? "Drop the PDF here..."
                    : file
                      ? file.name
                      : "Click to upload or drag & drop your PDF"}
                </p>
                <p className="text-xs text-gray-500">
                  Only PDF files. Parsing may take a few seconds.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl shadow-md hover:bg-blue-700 transition disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
              {uploading ? "Processing..." : "Upload & Extract"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              <XCircle className="w-5 h-5" />
              Reset
            </button>
          </div>
        </form>

        {/* Result / Preview area */}
        {result && (
          <div className="mt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-700 mb-1">
                  Parsed Data — please verify before saving
                </h3>
                <p className="text-sm text-gray-500">
                  The model tries its best but may be wrong. Edit manually if
                  needed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </button>

                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow hover:from-green-600 transition"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save & Fill"}
                </button>
              </div>
            </div>

            {result && (
              <div className="mt-8 space-y-6">

                {/* College Info */}
                {result.college_info && (
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <h3 className="font-semibold text-blue-700 mb-2">College Information</h3>
                    <p><strong>Name:</strong> {result.college_info.name}</p>
                    <p><strong>Session:</strong> {result.college_info.session}</p>
                    <p><strong>Effective Date:</strong> {result.college_info.effective_date}</p>
                  </div>
                )}

                {/* Time Slots - Show both original and transformed */}
                {result.time_slots && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded">
                    <h3 className="font-semibold text-green-700 mb-2">Time Slots (Transformed for Manual Editor)</h3>
                    
                    <div className="mb-4">
                      <p className="font-medium mb-1">Configuration:</p>
                      <ul className="text-sm space-y-1">
                        <li><strong>Start Time:</strong> {result.time_slots.start_time || "09:00"}</li>
                        <li><strong>End Time:</strong> {result.time_slots.end_time || "17:00"}</li>
                        <li><strong>Period Count:</strong> {result.time_slots.periodCount || 0}</li>
                        <li><strong>Period Duration:</strong> {result.time_slots.periodDuration || 45} minutes</li>
                        <li><strong>Short Break:</strong> {result.time_slots.shortBreak || 10} minutes after period {result.time_slots.shortBreakAfter || 2}</li>
                        <li><strong>Lunch Break:</strong> {result.time_slots.lunchBreak || 45} minutes after period {result.time_slots.lunchBreakAfter || 4}</li>
                      </ul>
                    </div>

                    {result.time_slots.periods?.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Schedule:</p>
                        <ul className="space-y-1 text-sm">
                          {result.time_slots.periods.map((p, idx) => {
                            const isBreak = p.type === "shortBreak" || p.type === "lunchBreak";
                            return (
                              <li key={idx} className={`bg-white p-2 rounded shadow-sm ${isBreak ? 'bg-yellow-50' : ''}`}>
                                <strong>
                                  {p.type === "shortBreak" ? "Short Break" : 
                                   p.type === "lunchBreak" ? "Lunch Break" : 
                                   `Period ${p.id}`}
                                </strong>: {p.start_time} → {p.end_time}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <p className="mt-2 text-sm"><strong>Working Days:</strong> {result.time_slots.working_days?.join(", ")}</p>
                    
                    <div className="mt-3 p-2 bg-blue-100 border border-blue-200 rounded">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> Time slots have been transformed to match manual editor format. 
                        All fields (period count, duration, breaks) are now pre-filled.
                      </p>
                    </div>
                  </div>
                )}

                {/* Departments */}
                {result.departments?.length > 0 && (
                  <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
                    <h3 className="font-semibold text-purple-700 mb-3">Departments</h3>

                    {result.departments.map((dept, idx) => (
                      <div key={idx} className="bg-white p-3 rounded shadow mb-2">
                        <p><strong>{dept.name}</strong> ({dept.dept_id})</p>

                        {dept.sections?.length > 0 && (
                          <ul className="list-disc text-sm ml-6 mt-2">
                            {dept.sections.map((sec, sidx) => (
                              <li key={sidx}>
                                Section <strong>{sec.name}</strong> — Sem {sec.semester}, Year {sec.year}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Subjects */}
                {result.subjects?.length > 0 && (
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                    <h3 className="font-semibold text-orange-700 mb-2">Subjects</h3>

                    <ul className="space-y-1 text-sm">
                      {result.subjects.map((sub, idx) => (
                        <li key={idx} className="bg-white p-2 rounded shadow-sm">
                          <strong>{sub.subject_id}</strong> — {sub.name} ({sub.department})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Faculty */}
                {result.faculty?.length > 0 && (
                  <div className="p-4 bg-teal-50 border-l-4 border-teal-600 rounded">
                    <h3 className="font-semibold text-teal-700 mb-3">Faculty</h3>

                    <ul className="space-y-1 text-sm">
                      {result.faculty.map((f, idx) => (
                        <li key={idx} className="bg-white p-2 rounded shadow-sm">
                          <strong>{f.name}</strong> ({f.department}) — {f.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rooms */}
                {result.rooms?.length > 0 && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <h3 className="font-semibold text-red-700 mb-2">Rooms</h3>

                    {result.rooms.map((room, idx) => (
                      <div key={idx} className="bg-white p-2 rounded shadow-sm text-sm">
                        <strong>{room.name}</strong> ({room.room_id}) — Capacity: {room.capacity} ({room.type})
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}


            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => navigate(`/dashboard/organisation-data-taker/${courseId}/${year}/${semester}/data`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white shadow hover:bg-blue-700 transition"
              >
                <ArrowRightCircle className="w-4 h-4" />
                Go to Manual Editor
              </button>

              <button
                onClick={() => {
                  toast.info(
                    "You can still edit data on the manual editor after saving."
                  );
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                View Guide
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>After upload, parsed data will appear here for verification.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPdf;