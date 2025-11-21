import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL,useAppState } from "../config";

import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

const OrganisationDataTaker = () => {
  const [activeTab, setActiveTab] = useState("college");
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const {hasOrganisationData,setHasOrganisationData} = useAppState()

  
  const {courseId,year,semester} = useParams()

  const defaultTemplates = {
    department: { dept_id: "", name: "", sections: [] },
    section: {
      section_id: "",
      name: "",
      semester: "",
      year: "",
      room: "",
      student_count: "",
      coordinator: "",
    },
    subject: { subject_id: "", name: "", credits: 0, department: "" },
    lab: { lab_id: "", name: "", department: "", room: "" },
    faculty: { faculty_id: "", name: "", department: "", email: "" },
    room: { room_id: "", name: "", capacity: 0, type: "classroom" },
    period: { id: null, start_time: "", end_time: "" },
  };

  const initialFormData = {
    college_info: { name: "", session: "", effective_date: "" },
    time_slots: {
      periods: [],
      working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      break_periods: [],
      lunch_period: null,
      mentorship_period: null,
    },
    departments: [],
    subjects: [],
    labs: [],
    faculty: [],
    rooms: [],
  };

  const [formData, setFormData] = useState(initialFormData);
const getSavedData = async () => {
  try {
    setIsLoading(true);
    const savedData = await axios.get(
      `${API_BASE_URL}/organisation/getOrganisationSavedData?year=${year}&course=${courseId}&semester=${semester}`,
      { withCredentials: true }
    );
    setFormData(savedData.data?.data || initialFormData);
    setHasOrganisationData(true);
  } catch (error) {
    console.log("Old data fetch failed", error);
  } finally {
    setIsLoading(false);
  }
};


  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.college_info.name.trim())
      newErrors.college_name = "College name is required";
    if (!formData.college_info.session.trim())
      newErrors.session = "Session is required";
    if (!formData.college_info.effective_date)
      newErrors.effective_date = "Effective date is required";
    if (formData.time_slots.periods.length === 0) {
      newErrors.periods = "At least one period is required";
    } else {
      formData.time_slots.periods.forEach((period, index) => {
        if (!period.start_time || !period.end_time) {
          newErrors[`period_${index}`] = "Start and end time are required";
        } else if (period.start_time >= period.end_time) {
          newErrors[`period_${index}_time`] =
            "End time must be after start time";
        }
      });
    }
    if (formData.departments.length === 0) {
      newErrors.departments = "At least one department is required";
    } else {
      formData.departments.forEach((dept, deptIndex) => {
        if (!dept.dept_id || !dept.name) {
          newErrors[`dept_${deptIndex}`] =
            "Department ID and name are required";
        }
        if (dept.sections && dept.sections.length > 0) {
          dept.sections.forEach((section, secIndex) => {
            if (!section.section_id || !section.name) {
              newErrors[`section_${deptIndex}_${secIndex}`] =
                "Section ID and name are requir ed";
            }
          });
        }
      });
    }
    const departmentIds = formData.departments.map((dept) => dept.dept_id);
    const duplicateDeptIds = departmentIds.filter(
      (id, index) => departmentIds.indexOf(id) !== index
    );
    if (duplicateDeptIds.length > 0) {
      newErrors.duplicate_dept_ids = "Department IDs must be unique";
    }
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const setForm = async () => {
    await getSavedData();
  };

  useEffect(() => {
    setForm();
  }, []);

  // Only validate when user has attempted to submit
  useEffect(() => {
    if (hasAttemptedSubmit) {
      validateForm();
    }
  }, [formData, hasAttemptedSubmit, validateForm]);

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleNestedInputChange = useCallback((path, value) => {
    const pathArray = path.split(".");
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  }, []);

  const GlobalLoader = ({ show }: { show: boolean }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999]">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

  const handleItemChange = useCallback((path, index, field, value) => {
    const pathParts = path.split(".");
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let currentLevel = newData;

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentLevel = currentLevel[pathParts[i]];
      }
      const arrayKey = pathParts[pathParts.length - 1];
      const targetArray = currentLevel[arrayKey];

      if (targetArray && targetArray[index]) {
        if (field) {
          targetArray[index][field] = value;
        } else {
          targetArray[index] = value;
        }
      }
      return newData;
    });
  }, []);

  const handleSectionChange = useCallback(
    (deptIndex, secIndex, field, value) => {
      setFormData((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));
        updated.departments[deptIndex].sections[secIndex][field] = value;
        return updated;
      });
    },
    []
  );

  const addArrayItem = useCallback((sectionPath, template) => {
    const path = sectionPath.split(".");
    const newItem = { ...template, _tempId: Date.now() + Math.random() };
    setFormData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      const arrayKey = path[path.length - 1];
      current[arrayKey] = [...(current[arrayKey] || []), newItem];
      return updated;
    });
  }, []);

  const removeItem = useCallback((sectionPath, index) => {
    const path = sectionPath.split(".");
    setFormData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      const arrayKey = path[path.length - 1];
      if (current[arrayKey]) {
        current[arrayKey] = current[arrayKey].filter((_, i) => i !== index);
      }
      return updated;
    });
  }, []);

const generateJson = async () => {
  setHasAttemptedSubmit(true);
  if (!validateForm()) {
    toast.error("Please fix validation errors before saving");
    return false;
  }

  setIsLoading(true);

  try {
    const payload = JSON.parse(JSON.stringify(formData));
    ["subjects", "labs", "faculty", "rooms", "time_slots.periods"].forEach((key) => {
      let items = payload;
      const path = key.split(".");
      for (let i = 0; i < path.length; i++) items = items[path[i]];
      if (Array.isArray(items)) items.forEach((i) => delete i._tempId);
    });

    const res = await axios.post(
      `${API_BASE_URL}/timetable/saveData/?course=${courseId}&year=${year}&semester=${semester}`,
      payload,
      { withCredentials: true }
    );

    toast.success("Data saved successfully!");
    setHasOrganisationData(true);
    return true;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error saving data";
    toast.error(errorMessage);
    return false;
  } finally {
    setIsLoading(false);
  }
};

const saveAndGenerate = async () => {
  setIsLoading(true);
  try {
    const ok = await generateJson();
    if (!ok) {
      setIsLoading(false);
      return;
    }

    const res = await axios.post(
      `${API_BASE_URL}/timetable/generate?course=${courseId}&year=${year}&semester=${semester}`,
      {},
      { withCredentials: true }
    );

    if (res.data?.data) {
      toast.success("Generation Successful");
      navigate(`/dashboard/timetable/variants/${courseId}/${year}/${semester}`);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error generating timetable");
  } finally {
    setIsLoading(false);
  }
};

const resetForm = async () => {
  if (!window.confirm("Are you sure? This cannot be undone.")) return;

  setIsLoading(true);

  try {
    const res = await axios.delete(
      `${API_BASE_URL}/organisation/resetData`,
      { withCredentials: true }
    );
    if (res.data.success) {
      setFormData(initialFormData);
      setHasOrganisationData(false);
      toast.info("Form has been reset");
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error resetting");
  } finally {
    setIsLoading(false);
  }
};

  const btnBase =
    "px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 w-full md:w-auto";
  const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300`;
  const btnSecondary = `${btnBase} bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400`;
  const btnSuccess = `${btnBase} bg-green-500 text-white hover:bg-green-600`;
  const btnDanger = `${btnBase} bg-red-500 text-white hover:bg-red-600`;

  // Helper function to check if field should show error
  const shouldShowError = (fieldPath) => {
    return hasAttemptedSubmit && errors[fieldPath];
  };

  const ArrayInput = React.memo(({ section, fields, data, errorKey }) => {
    return (

      <div className="space-y-4">
            <GlobalLoader show={isLoading} />
        {data.map((item, index) => (
          <div
            key={item._tempId || index}
            className="border p-4 rounded-md bg-gray-50/70"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}{" "}
                    {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === "select" ? (
                    <select
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        shouldShowError(`${errorKey}_${index}`)
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={item[f.name] || ""}
                      onChange={(e) =>
                        handleItemChange(section, index, f.name, e.target.value)
                      }
                    >
                      <option value="">Select {f.label}</option>
                      {f.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        shouldShowError(`${errorKey}_${index}`)
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={item[f.name] || ""}
                      onChange={(e) =>
                        handleItemChange(
                          section,
                          index,
                          f.name,
                          f.type === "number"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value
                        )
                      }
                      placeholder={f.placeholder}
                    />
                  )}
                  {shouldShowError(`${errorKey}_${index}`) && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`${errorKey}_${index}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className={btnDanger}
              onClick={() => removeItem(section, index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  });

  const tabs = [
    { id: "college", label: "College Info" },
    { id: "time", label: "Time Slots" },
    { id: "departments", label: "Departments" },
    { id: "subjects", label: "Subjects" },
    { id: "labs", label: "Labs" },
    { id: "faculty", label: "Faculty" },
    { id: "rooms", label: "Rooms" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      
    
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
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded mb-6 flex justify-between items-center">
    <div>
      <h3 className="font-semibold text-yellow-800">Large Data? Save Time!</h3>
      <p className="text-yellow-700 text-sm">
        Upload your existing timetable PDF and we’ll auto-fill everything for you.
      </p>
    </div>
    <button
      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow"
      onClick={() => navigate(`/dashboard/upload-pdf/${courseId}/${year}/${semester}`)}
    >
      Upload PDF
    </button>
  </div>
      <div className="container mx-auto px-2 sm:px-4 py-8">
        <div className="top-0 z-10 bg-gray-100/80 backdrop-blur-sm -mx-2 sm:-mx-4 px-2 sm:px-4">
          <div className="flex flex-nowrap border-b border-gray-300 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`px-4 py-3 font-medium border-b-2 text-sm md:text-base whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-400 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {hasAttemptedSubmit &&
          !isFormValid &&
          Object.keys(errors).length > 0 && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
              role="alert"
            >
              <h3 className="font-bold">Please fix the following errors:</h3>
              <ul className="list-disc list-inside mt-2 text-sm">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>{error}</li>
                ))}
              </ul>
            </div>
          )}

        <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-6">
          {activeTab === "college" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  COLLEGE NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    shouldShowError("college_name")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  value={formData.college_info.name}
                  onChange={(e) =>
                    handleInputChange("college_info", "name", e.target.value)
                  }
                  placeholder="Enter college name"
                />
                {shouldShowError("college_name") && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.college_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SESSION <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    shouldShowError("session")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  value={formData.college_info.session}
                  onChange={(e) =>
                    handleInputChange("college_info", "session", e.target.value)
                  }
                  placeholder="e.g., 2024-2025"
                />
                {shouldShowError("session") && (
                  <p className="text-red-500 text-xs mt-1">{errors.session}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EFFECTIVE DATE <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    shouldShowError("effective_date")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  value={formData.college_info.effective_date}
                  onChange={(e) =>
                    handleInputChange(
                      "college_info",
                      "effective_date",
                      e.target.value
                    )
                  }
                />
                {shouldShowError("effective_date") && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.effective_date}
                  </p>
                )}
              </div>
            </div>
          )}
{activeTab === "time" && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Time Slots</h2>

    {/* ERROR */}
    {errors?.periods && (
      <p className="text-red-500 text-sm mb-2">{errors.periods}</p>
    )}

    {/* START + END TIME (JSX unchanged) */}
    <div className="grid grid-cols-2 gap-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Start Time</label>
        <input
          type="time"
          className="border p-2 rounded w-full"
          value={formData.time_slots.start_time || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                start_time: e.target.value,
              },
            })
          }
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">End Time</label>
        <input
          type="time"
          className="border p-2 rounded w-full"
          value={formData.time_slots.end_time || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                end_time: e.target.value,
              },
            })
          }
        />
      </div>
    </div>

    {/* PERIOD COUNT + DURATION (JSX unchanged) */}
    <div className="grid grid-cols-2 gap-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Number of Periods</label>
        <select
          className="border p-2 rounded w-full"
          value={formData.time_slots.periodCount || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                periodCount: Number(e.target.value),
              },
            })
          }
        >
          <option value="">Select</option>
          <option value={6}>6 Periods</option>
          <option value={7}>7 Periods</option>
          <option value={8}>8 Periods</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Period Duration (minutes)</label>
        <input
          type="number"
          min="30"
          max="90"
          placeholder="45"
          className="border p-2 rounded w-full"
          value={formData.time_slots.periodDuration || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                periodDuration: Number(e.target.value),
              },
            })
          }
        />
      </div>
    </div>

    {/* BREAK + LUNCH DURATION (JSX unchanged) */}
    <div className="grid grid-cols-2 gap-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Short Break (minutes)</label>
        <input
          type="number"
          placeholder="10"
          min="5"
          className="border p-2 rounded w-full"
          value={formData.time_slots.shortBreak || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                shortBreak: Number(e.target.value),
              },
            })
          }
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Lunch Break (minutes)</label>
        <input
          type="number"
          placeholder="30"
          min="15"
          className="border p-2 rounded w-full"
          value={formData.time_slots.lunchBreak || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                lunchBreak: Number(e.target.value),
              },
            })
          }
        />
      </div>
    </div>

    {/* CHOOSE WHEN BREAKS OCCUR (JSX unchanged) */}
    <div className="grid grid-cols-2 gap-4">
      {/* Short Break Position */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Short Break After Period</label>
        <select
          className="border p-2 rounded w-full"
          value={formData.time_slots.shortBreakAfter || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                shortBreakAfter: Number(e.target.value),
              },
            })
          }
        >
          <option value="">Select</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              After Period {n}
            </option>
          ))}
        </select>
      </div>

      {/* Lunch Break Position */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Lunch Break After Period</label>
        <select
          className="border p-2 rounded w-full"
          value={formData.time_slots.lunchBreakAfter || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              time_slots: {
                ...formData.time_slots,
                lunchBreakAfter: Number(e.target.value),
              },
            })
          }
        >
          <option value="">Select</option>
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              After Period {n}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* GENERATE BUTTON */}
    <button
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full mb-6"
      onClick={() => {
        const {
          start_time,
          end_time,
          periodCount,
          periodDuration,
          shortBreak,
          lunchBreak,
          shortBreakAfter,
          lunchBreakAfter,
        } = formData.time_slots;

        if (!start_time || !end_time || !periodCount || !periodDuration)
          return alert("Please fill all required fields.");

        const [sh, sm] = start_time.split(":").map(Number);
        const [eh, em] = end_time.split(":").map(Number);

        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        if (endMinutes <= startMinutes)
          return alert("End time must be after start time.");

        // Use the defined durations, defaulting if they are zero/null
        const PERIOD = periodDuration || 45;
        const SHORT = shortBreak || 10;
        const LUNCH = lunchBreak || 30;

        const format = (m) =>
          `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
            m % 60
          ).padStart(2, "0")}`;

        let current = startMinutes;
        const generatedSchedule = []; // Holds Periods AND Breaks for UI display
        const simplePeriods = []; // Holds ONLY periods for Python model compatibility
        const breakPeriodsConfig = []; // IDs of periods followed by short break
        let lunchPeriodConfig = null; // ID of period followed by lunch

        for (let i = 1; i <= periodCount; i++) {
          const periodEnd = current + PERIOD;
          
          // 1. Add Period to both arrays
          const periodObject = {
            id: i,
            type: 'period', // For UI
            start_time: format(current),
            end_time: format(periodEnd),
            duration: PERIOD // For UI
          };
          generatedSchedule.push(periodObject);
          simplePeriods.push({ id: i, start_time: periodObject.start_time, end_time: periodObject.end_time });

          current = periodEnd; // Advance time to end of period

          // 2. Check for Short Break
          if (i === shortBreakAfter) {
            const breakEnd = current + SHORT;
            generatedSchedule.push({
              id: `short-break-${i}`,
              type: 'shortBreak', // For UI
              start_time: format(current),
              end_time: format(breakEnd),
              duration: SHORT // For UI
            });
            current = breakEnd; // Advance time by break duration
            breakPeriodsConfig.push(i); // Mark the period ID for Python model
          }

          // 3. Check for Lunch Break
          if (i === lunchBreakAfter) {
            const lunchEnd = current + LUNCH;
            generatedSchedule.push({
              id: `lunch-break-${i}`,
              type: 'lunchBreak', // For UI
              start_time: format(current),
              end_time: format(lunchEnd),
              duration: LUNCH // For UI
            });
            current = lunchEnd; // Advance time by lunch duration
            lunchPeriodConfig = i; // Mark the period ID for Python model
          }
        }

        // --- Validation: Check if the total time exceeds End Time ---
        if (current > endMinutes) {
          const totalDuration = current - startMinutes;
          const hoursNeeded = Math.floor(totalDuration / 60);
          const minsNeeded = totalDuration % 60;
          return alert(
            `Not enough time! The schedule requires ${hoursNeeded}h ${minsNeeded}m and ends at ${format(current)}. Please extend End Time.`
          );
        }
        
        // --- Final State Update ---
        setFormData({
          ...formData,
          time_slots: {
            ...formData.time_slots,
            // periods sent to backend must be the simplified 'simplePeriods' array
            periods: simplePeriods, 
            // We use 'generatedSchedule' for local UI display/rendering later
            generatedSchedule: generatedSchedule, 
            
            // Configuration for Python Model
            break_periods: breakPeriodsConfig.filter(id => id !== lunchPeriodConfig), // Exclude lunch period if it overlaps with a short break config
            lunch_period: lunchPeriodConfig,
          },
        });
      }}
    >
      Generate Time Slots
    </button>

    {/* DISPLAY FINAL SCHEDULE */}
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3">Generated Schedule Preview</h3>

      {/* We now use the new 'generatedSchedule' array for display */}
      {formData.time_slots.generatedSchedule?.length > 0 ? (
        <div className="space-y-2">
          {formData.time_slots.generatedSchedule.map((item) => {
            const isPeriod = item.type === "period";
            const isLunch = item.type === "lunchBreak";
            const isShortBreak = item.type === "shortBreak";

            return (
              <div
                key={item.id}
                className={`p-3 rounded border-l-4 shadow-sm flex justify-between items-center ${
                  isLunch
                    ? "bg-orange-100 border-orange-500"
                    : isShortBreak
                    ? "bg-yellow-100 border-yellow-500"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {isLunch ? "Lunch Break" : isShortBreak ? "Short Break" : `Period ${item.id}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.duration} minutes
                  </span>
                </div>

                <span className="font-mono text-sm">
                  {item.start_time} – {item.end_time}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400">No schedule generated yet.</p>
      )}
    </div>

    {/* WORKING DAYS (JSX unchanged) */}
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3">Working Days</h3>
      <div className="flex flex-wrap gap-2">
        {formData.time_slots.working_days?.map((day) => (
          <span
            key={day}
            className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  </div>
)}

          {activeTab === "departments" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Departments</h2>
              {shouldShowError("departments") && (
                <p className="text-red-500 text-sm mb-2">
                  {errors.departments}
                </p>
              )}
              {shouldShowError("duplicate_dept_ids") && (
                <p className="text-red-500 text-sm mb-2">
                  {errors.duplicate_dept_ids}
                </p>
              )}
              <div className="space-y-6">
                {formData.departments.map((dept, deptIndex) => (
                  <div
                    key={dept._tempId || deptIndex}
                    className="border p-4 rounded-lg bg-gray-50"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      Department {deptIndex + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`dept_${deptIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={dept.dept_id}
                          onChange={(e) =>
                            handleItemChange(
                              "departments",
                              deptIndex,
                              "dept_id",
                              e.target.value
                            )
                          }
                          placeholder="e.g., CS"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department Name{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`dept_${deptIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={dept.name}
                          onChange={(e) =>
                            handleItemChange(
                              "departments",
                              deptIndex,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                    </div>
                    {shouldShowError(`dept_${deptIndex}`) && (
                      <p className="text-red-500 text-xs mt-1 mb-2">
                        Department ID and name are required
                      </p>
                    )}

                    <h4 className="font-medium mb-2 text-md">Sections</h4>
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      {dept.sections?.map((sec, secIndex) => (
                        <div
                          key={sec._tempId || secIndex}
                          className="border p-3 rounded bg-white shadow-sm"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {[
                              {
                                name: "section_id",
                                label: "Section ID",
                                type: "text",
                                required: true,
                              },
                              {
                                name: "name",
                                label: "Section Name",
                                type: "text",
                                required: true,
                              },
                              {
                                name: "semester",
                                label: "Semester",
                                type: "number",
                              },
                              { name: "year", label: "Year", type: "number" },
                              { name: "room", label: "Room", type: "text" },
                              {
                                name: "student_count",
                                label: "Student Count",
                                type: "number",
                              },
                              {
                                name: "coordinator",
                                label: "Coordinator",
                                type: "text",
                              },
                            ].map((field) => (
                              <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label}{" "}
                                  {field.required && (
                                    <span className="text-red-500">*</span>
                                  )}
                                </label>
                                <input
                                  type={field.type}
                                  className={`w-full px-3 py-2 border rounded-md ${
                                    shouldShowError(
                                      `section_${deptIndex}_${secIndex}`
                                    )
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                  value={sec[field.name] || ""}
                                  onChange={(e) =>
                                    handleSectionChange(
                                      deptIndex,
                                      secIndex,
                                      field.name,
                                      field.type === "number"
                                        ? parseInt(e.target.value) || 0
                                        : e.target.value
                                    )
                                  }
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                              </div>
                            ))}
                          </div>
                          {shouldShowError(
                            `section_${deptIndex}_${secIndex}`
                          ) && (
                            <p className="text-red-500 text-xs mt-1 mb-2">
                              Section ID and name are required
                            </p>
                          )}
                          <button
                            type="button"
                            className={`${btnDanger} text-xs py-1 px-3`}
                            onClick={() => {
                              const updatedSections = dept.sections.filter(
                                (_, i) => i !== secIndex
                              );
                              handleItemChange(
                                "departments",
                                deptIndex,
                                "sections",
                                updatedSections
                              );
                            }}
                          >
                            Remove Section
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 mt-4">
                      <button
                        type="button"
                        className={btnSuccess}
                        onClick={() => {
                          const newSection = {
                            ...defaultTemplates.section,
                            _tempId: Date.now() + Math.random(),
                          };
                          const updatedSections = dept.sections
                            ? [...dept.sections, newSection]
                            : [newSection];
                          handleItemChange(
                            "departments",
                            deptIndex,
                            "sections",
                            updatedSections
                          );
                        }}
                      >
                        Add Section
                      </button>
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => removeItem("departments", deptIndex)}
                      >
                        Remove Department
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${btnSuccess} mt-6`}
                onClick={() =>
                  addArrayItem("departments", {
                    ...defaultTemplates.department,
                  })
                }
              >
                Add Department
              </button>
            </div>
          )}

          {/* Subjects Section */}
          {activeTab === "subjects" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Subjects</h2>
              {shouldShowError("subjects") && (
                <p className="text-red-500 text-sm mb-2">{errors.subjects}</p>
              )}
              <div className="space-y-6">
                {formData.subjects.map((subject, subjectIndex) => (
                  <div
                    key={subject._tempId || subjectIndex}
                    className="border p-4 rounded-lg bg-gray-50"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      Subject {subjectIndex + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.subject_id}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "subject_id",
                              e.target.value
                            )
                          }
                          placeholder="e.g., CS101"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.name}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Introduction to Programming"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Credits
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={subject.credits}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "credits",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="e.g., 3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.department}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "department",
                              e.target.value
                            )
                          }
                          placeholder="e.g., CS"
                        />
                      </div>
                    </div>
                    {shouldShowError(`subject_${subjectIndex}`) && (
                      <p className="text-red-500 text-xs mt-1 mb-2">
                        Subject ID and name are required
                      </p>
                    )}
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={() => removeItem("subjects", subjectIndex)}
                    >
                      Remove Subject
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${btnSuccess} mt-6`}
                onClick={() =>
                  addArrayItem("subjects", { ...defaultTemplates.subject })
                }
              >
                Add Subject
              </button>
            </div>
          )}

          {/* Labs Section */}
          {activeTab === "labs" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Labs</h2>
              {shouldShowError("labs") && (
                <p className="text-red-500 text-sm mb-2">{errors.labs}</p>
              )}
              <div className="space-y-6">
                {formData.labs.map((lab, labIndex) => (
                  <div
                    key={lab._tempId || labIndex}
                    className="border p-4 rounded-lg bg-gray-50"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      Lab {labIndex + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lab ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.lab_id}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "lab_id",
                              e.target.value
                            )
                          }
                          placeholder="e.g., CSLAB01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lab Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.name}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Data Structures Lab"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.department}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "department",
                              e.target.value
                            )
                          }
                          placeholder="e.g., CS"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.room}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "room",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Room 302"
                        />
                      </div>
                    </div>
                    {shouldShowError(`lab_${labIndex}`) && (
                      <p className="text-red-500 text-xs mt-1 mb-2">
                        Lab ID and name are required
                      </p>
                    )}
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={() => removeItem("labs", labIndex)}
                    >
                      Remove Lab
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${btnSuccess} mt-6`}
                onClick={() =>
                  addArrayItem("labs", { ...defaultTemplates.lab })
                }
              >
                Add Lab
              </button>
            </div>
          )}

          {activeTab === "faculty" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Faculty</h2>
              {shouldShowError("faculty") && (
                <p className="text-red-500 text-sm mb-2">{errors.faculty}</p>
              )}
              <div className="space-y-6">
                {formData.faculty.map((member, index) => (
                  <div
                    key={member._tempId || index}
                    className="border p-4 rounded-lg bg-gray-50"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      Faculty Member {index + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Faculty ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.faculty_id}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "faculty_id",
                              e.target.value
                            )
                          }
                          placeholder="e.g., F001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Faculty Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.name}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Dr. Jane Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.department}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "department",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.email}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "email",
                              e.target.value
                            )
                          }
                          placeholder="e.g., jane.doe@college.edu"
                        />
                      </div>
                    </div>
                    {shouldShowError(`faculty_${index}`) && (
                      <p className="text-red-500 text-xs mt-1 mb-2">
                        Faculty ID and name are required
                      </p>
                    )}
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={() => removeItem("faculty", index)}
                    >
                      Remove Faculty
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${btnSuccess} mt-4`}
                onClick={() =>
                  addArrayItem("faculty", { ...defaultTemplates.faculty })
                }
              >
                Add Faculty
              </button>
            </div>
          )}

          {activeTab === "rooms" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Rooms</h2>
              {shouldShowError("rooms") && (
                <p className="text-red-500 text-sm mb-2">{errors.rooms}</p>
              )}
              <div className="space-y-6">
                {formData.rooms.map((room, index) => (
                  <div
                    key={room._tempId || index}
                    className="border p-4 rounded-lg bg-gray-50"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      Room {index + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`room_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={room.room_id}
                          onChange={(e) =>
                            handleItemChange(
                              "rooms",
                              index,
                              "room_id",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`room_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={room.name}
                          onChange={(e) =>
                            handleItemChange(
                              "rooms",
                              index,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`room_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={room.capacity}
                          onChange={(e) =>
                            handleItemChange(
                              "rooms",
                              index,
                              "capacity",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`room_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={room.type}
                          onChange={(e) =>
                            handleItemChange(
                              "rooms",
                              index,
                              "type",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select a type</option>
                          <option value="classroom">Classroom</option>
                          <option value="lab">Laboratory</option>
                          <option value="auditorium">Auditorium</option>
                          <option value="conference">Conference Room</option>
                        </select>
                      </div>
                    </div>
                    {shouldShowError(`room_${index}`) && (
                      <p className="text-red-500 text-xs mt-1 mb-2">
                        Room ID and name are required
                      </p>
                    )}
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={() => removeItem("rooms", index)}
                    >
                      Remove Room
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${btnSuccess} mt-4`}
                onClick={() =>
                  addArrayItem("rooms", { ...defaultTemplates.room })
                }
              >
                Add Room
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse md:flex-row md:justify-end gap-4">
          <button
            type="button"
            className={btnSecondary}
            onClick={resetForm}
            disabled={isSubmitting}
          >
            Reset Form
          </button>
          <button
            className={btnPrimary}
            onClick={generateJson}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save For Generation"}
          </button>
          <button
            className={btnPrimary}
            onClick={saveAndGenerate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Generating..." : "Save and Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganisationDataTaker;
