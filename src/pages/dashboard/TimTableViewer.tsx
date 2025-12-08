import React, { useState, useCallback, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- NLP Update Modal Component ---
const NLPUpdateModal = ({ 
  isOpen, 
  onClose, 
  course, 
  year, 
  semester, 
  organisation_id,
  onUpdateSuccess 
}) => {
  const [nlpText, setNlpText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: input, 2: preview, 3: regenerating

  const parseNLPCommand = async () => {
    if (!nlpText.trim()) {
      setError("Please enter a command");
      return;
    }

    if (!course || !year || !semester) {
      setError("Course, Year, and Semester are required for NLP processing");
      return;
    }

    setIsProcessing(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/nlp/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          text: nlpText,
          course,
          year,
          semester,
          organisation_id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.interpreted_data) {
        setParsedResult(data.interpreted_data);
        setStep(2); // Move to preview step
        toast.info("NLP command parsed successfully!");
      } else {
        setError("No structured data returned from NLP parser");
      }
    } catch (err) {
      console.error("NLP parsing error:", err);
      setError(err.message || "Failed to process NLP command");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyEventsAndRegenerate = async () => {
    setIsProcessing(true);
    setStep(3); // Show regenerating step
    
    try {
      const events = parsedResult?.events || [];
      
      const response = await fetch(`${API_BASE_URL}/api/regenerate-with-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          events,
          course,
          year,
          semester,
          organisation_id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.solutions && data.solutions.length > 0) {
        toast.success("Timetable regenerated successfully!");
        onUpdateSuccess(data.solutions);
        resetModal();
        onClose();
      } else {
        throw new Error("No solutions returned from regeneration");
      }
    } catch (err) {
      console.error("Regeneration error:", err);
      setError(err.message || "Failed to regenerate timetable");
      setStep(2); // Go back to preview step
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setNlpText("");
    setParsedResult(null);
    setError("");
    setStep(1);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {step === 1 && "Update Timetable with NLP"}
            {step === 2 && "Preview Changes"}
            {step === 3 && "Regenerating Timetable..."}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-light"
            disabled={isProcessing}
          >
            &times;
          </button>
        </div>

        {/* Step 1: Input NLP Command */}
        {step === 1 && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Enter your command in natural language:
              </label>
              <textarea
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                placeholder="Examples:
                • 'Dr. Smith is absent on Monday and Tuesday'
                • 'Room 101 is under maintenance this week'
                • 'CSE-A section has field trip on Wednesday'
                • 'Assign AI course to Dr. Johnson for CSE-B on Monday Period 1'
                • 'No faculty should have more than 6 classes per day'"
                className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <button
                onClick={parseNLPCommand}
                disabled={isProcessing || !nlpText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Parse & Preview"}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Preview Parsed Events */}
        {step === 2 && parsedResult && (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Detected Changes:</h3>
              
              {/* Display Intent */}
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Intent: {parsedResult.intent}
                </span>
              </div>

              {/* Display Events */}
              {parsedResult.events && parsedResult.events.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Events to Apply:</h4>
                  <div className="space-y-3">
                    {parsedResult.events.map((event, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium mb-2">
                              {event.type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <div className="mt-2 space-y-1 text-sm">
                              {event.faculty_id && (
                                <div><span className="font-medium">Faculty:</span> {event.faculty_id}</div>
                              )}
                              {event.section_id && (
                                <div><span className="font-medium">Section:</span> {event.section_id}</div>
                              )}
                              {event.room_id && (
                                <div><span className="font-medium">Room:</span> {event.room_id}</div>
                              )}
                              {event.start_day && (
                                <div><span className="font-medium">From:</span> {event.start_day}</div>
                              )}
                              {event.end_day && (
                                <div><span className="font-medium">To:</span> {event.end_day}</div>
                              )}
                              {event.day && (
                                <div><span className="font-medium">Day:</span> {event.day}</div>
                              )}
                              {event.timeslot && (
                                <div><span className="font-medium">Period:</span> {event.timeslot}</div>
                              )}
                              {event.reason && (
                                <div><span className="font-medium">Reason:</span> {event.reason}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Display Constraints */}
              {parsedResult.constraints && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Constraints to Update:</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(parsedResult.constraints, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isProcessing}
              >
                ← Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                
                <button
                  onClick={applyEventsAndRegenerate}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Applying..." : "Apply Changes & Regenerate"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Regenerating */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Regenerating timetable with your changes...</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Variant Rank Selector Modal ---
const VariantRankModal = ({ variants, onClose, onSelectVariant, course, year, semester }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Select Timetable Variant 🏆
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-light">
            &times;
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Showing solutions for: {course.toUpperCase()} / Y{year} / S{semester}
        </p>

        <div className="space-y-3">
          {variants.length === 0 ? (
            <p className="text-gray-500">No other variants found.</p>
          ) : (
            variants.map((v, index) => (
              <div 
                key={v._id || index}
                className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center hover:bg-blue-50 transition cursor-pointer"
                onClick={() => onSelectVariant(v.rank || index)}
              >
                <div>
                  <p className="font-semibold text-lg">Variant Rank {v.rank || index + 1}</p>
                  <p className="text-xs text-gray-600">Fitness: {v.fitness?.toFixed(2) || "N/A"}</p>
                  <p className="text-xs text-gray-600">
                    Sections: {v.total_sections || v.sections?.length || "N/A"} | 
                    Faculty: {v.total_faculty || v.faculty?.length || "N/A"}
                  </p>
                </div>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap">
                  View This Rank
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main TimeTableViewer Component ---
const TimeTableViewer = ({ 
  type = "section", 
  data = {}, 
  course = "", 
  year = "", 
  semester = "", 
  organisation_id = "",
  onVariantChange,
  onTimetableRegenerate,
  currentVariant = 0,
  totalVariants = 1
}) => {
  const [index, setIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotData, setSlotData] = useState({});
  
  // States for modals
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [showNLPModal, setShowNLPModal] = useState(false);
  const [variantRanks, setVariantRanks] = useState([]);
  const [isFetchingRanks, setIsFetchingRanks] = useState(false);
  
  // Extract items from data
  const items = Object.values(data || {});
  const item = items[index] || {};

  // Reset index when data changes
  useEffect(() => {
    setIndex(0);
  }, [data]);

  // Color function for slots
  const getSubjectColor = (slot) => { 
    if (!slot || slot === "FREE" || slot.subject === "FREE") return "#f0f0f0";
    
    // Generate consistent color based on subject
    const colors = [
      "#ffe6c4", "#c4e1ff", "#c4ffd9", 
      "#ffc4e1", "#e1c4ff", "#fff8c4",
      "#c4fff8", "#ffd9c4", "#e1ffc4"
    ];
    
    if (typeof slot === "string") {
      const hash = slot.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }
    
    const hash = (slot.subject || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // Export functions
  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Period', ...days]],
      body: Object.entries(item.periods || {}).map(([p, time]) => [
        time,
        ...days.map(day => {
          const slot = item.timetable?.[day]?.[p] || "FREE";
          return typeof slot === "string" ? slot : `${slot.subject} (${slot.room})`;
        })
      ])
    });
    doc.save(`${item.section_id || item.faculty_name}_timetable.pdf`);
  };

  // Start edit function
  const startEdit = (day, period, slot) => { 
    setEditingSlot({ day, period });
    setSlotData(typeof slot === "string" ? { subject: slot } : { ...slot });
    setIsEditing(true); 
  };

  // Save edit function
  const saveEdit = async () => { 
    toast.info("Edit saved locally. Use NLP updates for permanent changes.");
    setIsEditing(false); 
  };

  // Fetch variant ranks
  const fetchVariantRanks = useCallback(async () => {
    if (!course || !year || !semester) return;
    
    setIsFetchingRanks(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/timetable/solutions?course=${course}&year=${year}&semester=${semester}`,
        { credentials: "include" }
      );
      
      if (!response.ok) throw new Error("Failed to fetch variants");
      
      const data = await response.json();
      const solutions = data.data?.solutions || data.solutions || [];
      const sortedVariants = solutions.sort((a, b) => (a.rank || 0) - (b.rank || 0));
      
      setVariantRanks(sortedVariants);
    } catch (err) {
      console.error("Error fetching variants:", err);
      toast.error("Failed to load variant ranks");
    } finally {
      setIsFetchingRanks(false);
    }
  }, [course, year, semester]);

  // Handle viewing variant ranks
  const handleViewVariantRanks = () => {
    if (variantRanks.length === 0) {
      fetchVariantRanks();
    }
    setShowVariantsModal(true);
  };

  // Handle variant selection
  const handleSelectVariant = (variantIndex) => {
    setShowVariantsModal(false);
    
    if (typeof onVariantChange === 'function') {
      onVariantChange(variantIndex);
    } else {
      toast.info(`Switched to variant ${variantIndex + 1}`);
    }
  };

  // Handle NLP update success
  const handleNLPUpdateSuccess = (solutions) => {
    setShowNLPModal(false);
    
    if (typeof onTimetableRegenerate === 'function' && solutions.length > 0) {
      // Transform the first solution to match the expected data format
      const firstSolution = solutions[0];
      
      if (type === "section") {
        // Convert sections array to object with section_id as keys
        const sectionsData = {};
        if (firstSolution.sections && Array.isArray(firstSolution.sections)) {
          firstSolution.sections.forEach(section => {
            if (section.section_id) {
              sectionsData[section.section_id] = section;
            }
          });
        }
        
        // Update variant ranks
        const newVariants = solutions.map((sol, idx) => ({
          _id: `regenerated-${idx}`,
          rank: idx + 1,
          fitness: sol.fitness || 0,
          sections: sol.sections || [],
          faculty: sol.faculty || []
        }));
        
        setVariantRanks(newVariants);
        onTimetableRegenerate(sectionsData, newVariants);
        
      } else if (type === "faculty") {
        // Convert faculty array to object with faculty_id as keys
        const facultyData = {};
        if (firstSolution.faculty && Array.isArray(firstSolution.faculty)) {
          firstSolution.faculty.forEach(faculty => {
            if (faculty.faculty_id) {
              facultyData[faculty.faculty_id] = faculty;
            }
          });
        }
        
        // Update variant ranks
        const newVariants = solutions.map((sol, idx) => ({
          _id: `regenerated-${idx}`,
          rank: idx + 1,
          fitness: sol.fitness || 0,
          sections: sol.sections || [],
          faculty: sol.faculty || []
        }));
        
        setVariantRanks(newVariants);
        onTimetableRegenerate(facultyData, newVariants);
      }
    }
    
    toast.success("Timetable updated successfully!");
  };

  if (!item || Object.keys(item).length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No timetable data available</p>
        <p className="text-sm mt-2">Generate a timetable first or select a variant</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {type === "faculty"
              ? `${item.faculty_name || 'Faculty'} (${item.department || 'N/A'})`
              : `${item.section_id || 'Section'} - ${item.section_name || 'N/A'}`}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {course} • Year {year} • Semester {semester}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2">
          {/* NLP Update Button */}
          <button 
            onClick={() => setShowNLPModal(true)}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition whitespace-nowrap shadow-md flex items-center gap-2"
            title="Update timetable using natural language"
          >
            <span>✨</span> NLP Update
          </button>

          {/* Variant Ranks Button */}
          <button 
            onClick={handleViewVariantRanks} 
            className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition whitespace-nowrap flex items-center gap-2"
            disabled={isFetchingRanks}
          >
            <span>🏆</span>
            {isFetchingRanks ? 'Loading...' : `Variant ${currentVariant + 1}/${totalVariants}`}
          </button>

          {/* Export Buttons */}
          <button onClick={exportPDF} className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2">
            <span>📄</span> PDF
          </button>
        </div>
      </div>
      
      {/* PAGINATION (for multiple sections/faculty) */}
      {items.length > 1 && (
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <button 
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            className="p-2 border rounded-lg hover:bg-white flex items-center gap-2"
          >
            ← Previous
          </button>
          <div className="text-center">
            <span className="font-semibold text-blue-600">
              {index + 1} of {items.length}
            </span>
            <p className="text-xs text-gray-500">
              {type === "section" ? "Sections" : "Faculty Members"}
            </p>
          </div>
          <button 
            onClick={() => setIndex((i) => (i + 1) % items.length)}
            className="p-2 border rounded-lg hover:bg-white flex items-center gap-2"
          >
            Next →
          </button>
        </div>
      )}
      
      {/* TIMETABLE GRID */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="border p-3 text-left w-32">Period / Time</th>
              {days.map((d) => (
                <th key={d} className="border p-3 text-center">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(item.periods || {}).map(([periodId, time]) => (
              <tr key={periodId} className="hover:bg-gray-50">
                <td className="border p-3 bg-gray-50 font-medium text-center">
                  <div>Period {periodId}</div>
                  <div className="text-xs text-gray-500">{formatTime(time)}</div>
                </td>

                {days.map((day) => {
                  const slot = item.timetable?.[day]?.[periodId] || "FREE";
                  const isFree = !slot || slot === "FREE" || slot.subject === "FREE";
                  
                  return (
                    <td
                      key={`${day}-${periodId}`}
                      className="border p-3 cursor-pointer transition-all hover:shadow-md"
                      onClick={() => startEdit(day, periodId, slot)}
                      style={{ 
                        backgroundColor: getSubjectColor(slot),
                        borderLeft: isFree ? '1px solid #e5e7eb' : `4px solid ${getSubjectColor(slot).replace('0.8', '1')}`
                      }}
                    >
                      {isFree ? (
                        <div className="text-center text-gray-400 py-2">
                          FREE
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">
                            {slot.subject || "N/A"}
                          </div>
                          <div className="text-xs text-gray-700">
                            {slot.room && `📍 ${slot.room}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {slot.faculty_name && `👨‍🏫 ${slot.faculty_name}`}
                            {slot.section && ` | 📚 ${slot.section}`}
                            {slot.type && ` | ${slot.type}`}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300"></div>
            <span>Scheduled Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300"></div>
            <span>Free Slot</span>
          </div>
          <div className="ml-auto text-sm">
            <span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* NLP MODAL */}
      <NLPUpdateModal
        isOpen={showNLPModal}
        onClose={() => setShowNLPModal(false)}
        course={course}
        year={year}
        semester={semester}
        organisation_id={organisation_id}
        onUpdateSuccess={handleNLPUpdateSuccess}
      />

      {/* VARIANT RANK MODAL */}
      {showVariantsModal && (
        <VariantRankModal
          variants={variantRanks}
          onClose={() => setShowVariantsModal(false)}
          onSelectVariant={handleSelectVariant}
          course={course}
          year={year}
          semester={semester}
        />
      )}
      
      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Slot</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={slotData.subject || ""}
                  onChange={(e) => setSlotData({...slotData, subject: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Room</label>
                <input
                  type="text"
                  value={slotData.room || ""}
                  onChange={(e) => setSlotData({...slotData, room: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={() => setSlotData({ subject: "FREE" })} 
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Mark Free
              </button>
              <button 
                onClick={saveEdit} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTableViewer;