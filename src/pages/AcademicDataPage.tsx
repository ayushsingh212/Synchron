import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL, useAppState } from "../config";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

const OrganisationDataTaker = () => {
  const [activeTab, setActiveTab] = useState("college");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");

  const navigate = useNavigate();
  const { hasOrganisationData, setHasOrganisationData } = useAppState();

  const { courseId, year, semester } = useParams();

  const defaultTemplates = {
    department: { dept_id: "", name: "", sections: [] as any[] },
    section: {
      section_id: "",
      name: "",
      semester: semester || "",
      year: year || "",
      room: "",
      student_count: "",
      coordinator: "",
      specialization: "",
    },
    subject: {
      subject_id: "",
      name: "",
      credits: 0,
      type: "",
      semester: semester || "",
      lectures_per_week: "",
      min_classes_per_week: "",
      max_classes_per_day: "",
      departments: [] as string[],
      tutorial_sessions: 0,
      specialization: "",
      flexible_timing: false,
    },
    lab: {
      lab_id: "",
      name: "",
      type: "",
      credits: "",
      sessions_per_week: "",
      duration_hours: "",
      semester: semester || "",
      departments: [] as string[],
      lab_rooms: [] as string[],
      specialization: "",
    },
    faculty: {
      faculty_id: "",
      name: "",
      department: "",
      designation: "",
      subjects: [] as string[],
      max_hours_per_week: "",
      avg_leaves_per_month: "",
      preferred_time_slots: [] as number[],
    },
    room: {
      room_id: "",
      name: "",
      capacity: 0,
      type: "classroom",
      department: "",
      equipment: [] as string[],
    },
    period: { id: null as number | null, start_time: "", end_time: "" },
  };

  const initialFormData = {
    college_info: { name: "", session: "", effective_date: "" },
    time_slots: {
      periods: [] as { id: number; type: "period" | "shortBreak" | "lunchBreak"; start_time: string; end_time: string }[],
      working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      break_periods: [] as number[],
      lunch_period: null as number | null,
      start_time: "",
      end_time: "",
      periodCount: undefined as number | undefined,
      periodDuration: undefined as number | undefined,
      shortBreak: undefined as number | undefined,
      lunchBreak: undefined as number | undefined,
      shortBreakAfter: undefined as number | undefined,
      lunchBreakAfter: undefined as number | undefined,
      generatedSchedule: [] as {
        id: number | string;
        type: "period" | "shortBreak" | "lunchBreak";
        start_time: string;
        end_time: string;
        duration: number;
      }[],
    },
    departments: [] as any[],
    subjects: [] as any[],
    labs: [] as any[],
    faculty: [] as any[],
    rooms: [] as any[],
    constraints: {
      hard_constraints: {
        no_faculty_clash: true,
        no_room_clash: true,
        no_section_clash: true,
        break_periods_fixed: [] as number[],
        lunch_period_fixed: null as number | null,
        max_classes_per_day_per_section: 7,
        min_classes_per_week_per_subject: true,
        lab_duration_consecutive: true,
        faculty_availability: true,
        section_room_assignment: true,
      },
      soft_constraints: {
        balanced_daily_load: {
          weight: 0.3,
          max_deviation: 2,
        },
        faculty_preference_slots: {
          weight: 0.2,
        },
        minimize_faculty_travel: {
          weight: 0.15,
        },
        morning_heavy_subjects: {
          weight: 0.1,
          subjects: [] as string[],
        },
        avoid_single_period_gaps: {
          weight: 0.15,
        },
        distribute_subjects_evenly: {
          weight: 0.1,
        },
        minimize_free_periods: {
          weight: 0.25,
        },
      },
    },
    special_requirements: {
      mentorship_break: {
        period: null as number | null,
        duration: 1,
        all_sections: true,
      },
      library_periods: {
        sections: [] as string[],
        periods_per_week: 1,
        flexible: true,
      },
      project_work: {
        sections: [] as string[],
        periods_per_week: 8,
        flexible_scheduling: true,
      },
      tutorial_classes: {
        subjects: [] as string[],
        marked_as: "T",
        duration: 1,
      },
      open_electives: {
        cross_department: true,
        faculty_rotation: true,
      },
      minors_honors: {
        delivery_mode: "online",
        platform: "Google Meet",
        sections: [] as string[],
        periods: [] as number[],
      },
      lab_batch_division: {
        max_students_per_batch: 15,
        batch_naming: ["A", "B", "C", "D"],
        rotation_labs: [] as string[],
      },
    },
  };

  const [formData, setFormData] = useState(initialFormData);

  const GlobalLoader = ({ show }: { show: boolean }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999]">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  };

  const mergeConstraints = (saved: any) => {
    const c = saved?.constraints || {};
    const hc = c.hard_constraints || {};
    const sc = c.soft_constraints || {};
    return {
      hard_constraints: {
        ...initialFormData.constraints.hard_constraints,
        ...hc,
      },
      soft_constraints: {
        balanced_daily_load: {
          ...initialFormData.constraints.soft_constraints.balanced_daily_load,
          ...(sc.balanced_daily_load || {}),
        },
        faculty_preference_slots: {
          ...initialFormData.constraints.soft_constraints
            .faculty_preference_slots,
          ...(sc.faculty_preference_slots || {}),
        },
        minimize_faculty_travel: {
          ...initialFormData.constraints.soft_constraints
            .minimize_faculty_travel,
          ...(sc.minimize_faculty_travel || {}),
        },
        morning_heavy_subjects: {
          ...initialFormData.constraints.soft_constraints
            .morning_heavy_subjects,
          ...(sc.morning_heavy_subjects || {}),
        },
        avoid_single_period_gaps: {
          ...initialFormData.constraints.soft_constraints
            .avoid_single_period_gaps,
          ...(sc.avoid_single_period_gaps || {}),
        },
        distribute_subjects_evenly: {
          ...initialFormData.constraints.soft_constraints
            .distribute_subjects_evenly,
          ...(sc.distribute_subjects_evenly || {}),
        },
        minimize_free_periods: {
          ...initialFormData.constraints.soft_constraints.minimize_free_periods,
          ...(sc.minimize_free_periods || {}),
        },
      },
    };
  };

  const mergeSpecialRequirements = (saved: any) => {
    const s = saved?.special_requirements || {};
    return {
      mentorship_break: {
        ...initialFormData.special_requirements.mentorship_break,
        ...(s.mentorship_break || {}),
      },
      library_periods: {
        ...initialFormData.special_requirements.library_periods,
        ...(s.library_periods || {}),
      },
      project_work: {
        ...initialFormData.special_requirements.project_work,
        ...(s.project_work || {}),
      },
      tutorial_classes: {
        ...initialFormData.special_requirements.tutorial_classes,
        ...(s.tutorial_classes || {}),
      },
      open_electives: {
        ...initialFormData.special_requirements.open_electives,
        ...(s.open_electives || {}),
      },
      minors_honors: {
        ...initialFormData.special_requirements.minors_honors,
        ...(s.minors_honors || {}),
      },
      lab_batch_division: {
        ...initialFormData.special_requirements.lab_batch_division,
        ...(s.lab_batch_division || {}),
      },
    };
  };

  const getSavedData = async () => {
    try {
      setIsLoading(true);
      setLoadingAction("load");
      const savedData = await axios.get(
        `${API_BASE_URL}/organisation/getOrganisationSavedData?year=${year}&course=${courseId}&semester=${semester}`,
        { withCredentials: true }
      );
      const data = savedData.data?.data;
      if (data) {
        const merged = {
          ...initialFormData,
          ...data,
          college_info: {
            ...initialFormData.college_info,
            ...(data.college_info || {}),
          },
          time_slots: {
            ...initialFormData.time_slots,
            ...(data.time_slots || {}),
          },
          departments: data.departments || [],
          subjects: data.subjects || [],
          labs: data.labs || [],
          faculty: data.faculty || [],
          rooms: data.rooms || [],
          constraints: mergeConstraints(data),
          special_requirements: mergeSpecialRequirements(data),
        };
        setFormData(merged);
        setHasOrganisationData(true);
      } else {
        setFormData(initialFormData);
      }
    } catch (error) {
      console.log("Old data fetch failed", error);
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.college_info.name.trim())
      newErrors.college_name = "College name is required";
    if (!formData.college_info.session.trim())
      newErrors.session = "Session is required";
    if (!formData.college_info.effective_date)
      newErrors.effective_date = "Effective date is required";

    if (formData.time_slots.periods.length === 0) {
      newErrors.periods = "At least one period is required. Generate time slots first.";
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
    }

    const departmentIds = formData.departments
      .map((dept: any) => (dept.dept_id || "").trim())
      .filter(Boolean);
    const duplicateDeptIds = departmentIds.filter(
      (id, index) => departmentIds.indexOf(id) !== index
    );
    if (duplicateDeptIds.length > 0) {
      newErrors.duplicate_dept_ids = "Department IDs must be unique";
    }

    const deptIdSet = new Set(departmentIds);
    const deptHasSections: Record<string, boolean> = {};
    let hasAnySection = false;

    formData.departments.forEach((dept: any, deptIndex: number) => {
      if (!dept.dept_id || !dept.name) {
        newErrors[`dept_${deptIndex}`] =
          "Department ID and name are required";
      }
      const id = (dept.dept_id || "").trim();
      const sections = Array.isArray(dept.sections) ? dept.sections : [];
      deptHasSections[id] = sections.length > 0;
      if (sections.length === 0) {
        newErrors[`dept_${deptIndex}_sections`] =
          "At least one section is required for this department";
      } else {
        hasAnySection = true;
      }
      sections.forEach((section: any, secIndex: number) => {
        if (!section.section_id || !section.name) {
          newErrors[`section_${deptIndex}_${secIndex}`] =
            "Section ID and name are required";
        }
      });
    });

    if (!hasAnySection) {
      newErrors.sections = "At least one section is required overall";
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = "At least one subject is required";
    }

    const subjectIds = formData.subjects
      .map((s: any) => (s.subject_id || "").trim())
      .filter(Boolean);
    const subjectIdSet = new Set(subjectIds);

    formData.subjects.forEach((subject: any, subjectIndex: number) => {
      if (!subject.subject_id || !subject.name) {
        newErrors[`subject_${subjectIndex}`] =
          "Subject ID and name are required";
      }
      const subjectDepts = Array.isArray(subject.departments)
        ? subject.departments
        : [];
      if (subjectDepts.length === 0) {
        newErrors[`subject_${subjectIndex}_departments`] =
          "Assign at least one department to this subject";
      } else {
        const invalidDept = subjectDepts.find(
          (d: string) => !deptIdSet.has(d.trim())
        );
        if (invalidDept) {
          newErrors[`subject_${subjectIndex}_departments`] =
            `Department "${invalidDept}" is not defined in Departments tab`;
        } else {
          const hasSectionInDept = subjectDepts.some((d: string) =>
            deptHasSections[d.trim()]
          );
          if (!hasSectionInDept) {
            newErrors[`subject_${subjectIndex}_departments`] =
              "Assign subject to a department that has at least one section";
          }
        }
      }
    });

    formData.labs.forEach((lab: any, labIndex: number) => {
      if (!lab.lab_id || !lab.name) {
        newErrors[`lab_${labIndex}`] = "Lab ID and name are required";
      }
      const labDepts = Array.isArray(lab.departments)
        ? lab.departments
        : [];
      const invalidLabDept = labDepts.find(
        (d: string) => !deptIdSet.has(d.trim())
      );
      if (invalidLabDept) {
        newErrors[`lab_${labIndex}_departments`] =
          `Department "${invalidLabDept}" is not defined in Departments tab`;
      }
    });

    if (formData.faculty.length === 0) {
      newErrors.faculty = "At least one faculty member is required";
    }

    formData.faculty.forEach((member: any, index: number) => {
      if (!member.faculty_id || !member.name) {
        newErrors[`faculty_${index}`] =
          "Faculty ID and name are required";
      }
      if (
        member.department &&
        !deptIdSet.has((member.department || "").trim())
      ) {
        newErrors[`faculty_${index}_department`] =
          `Department "${member.department}" is not defined in Departments tab`;
      }
      const facSubjects = Array.isArray(member.subjects)
        ? member.subjects
        : [];
      if (facSubjects.length === 0) {
        newErrors[`faculty_${index}_subjects`] =
          "Assign at least one subject to this faculty member";
      } else {
        const invalidSubjects = facSubjects.filter(
          (s: string) => !subjectIdSet.has(s.trim())
        );
        if (invalidSubjects.length > 0) {
          newErrors[`faculty_${index}_subjects`] =
            `Invalid subject IDs: ${invalidSubjects.join(", ")}`;
        }
      }
    });

    if (formData.rooms.length === 0) {
      newErrors.rooms = "At least one room is required";
    }

    formData.rooms.forEach((room: any, index: number) => {
      if (!room.room_id || !room.name) {
        newErrors[`room_${index}`] = "Room ID and name are required";
      }
      if (!room.capacity || Number(room.capacity) <= 0) {
        newErrors[`room_${index}_capacity`] =
          "Room capacity must be greater than 0";
      }
      if (
        room.department &&
        !deptIdSet.has((room.department || "").trim())
      ) {
        newErrors[`room_${index}_department`] =
          `Department "${room.department}" is not defined in Departments tab`;
      }
    });

    setErrors(newErrors);
    const ok = Object.keys(newErrors).length === 0;
    setIsFormValid(ok);
    return ok;
  }, [formData]);

  const setForm = async () => {
    await getSavedData();
  };

  useEffect(() => {
    setForm();
  }, []);

  useEffect(() => {
    if (hasAttemptedSubmit) {
      validateForm();
    }
  }, [formData, hasAttemptedSubmit, validateForm]);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value },
    }));
  };

  const handleNestedInputChange = useCallback((path: string, value: any) => {
    const pathArray = path.split(".");
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData as any;
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  }, []);

  const handleItemChange = useCallback(
    (path: string, index: number, field: string | null, value: any) => {
      const pathParts = path.split(".");
      setFormData((prev) => {
        const newData = JSON.parse(JSON.stringify(prev));
        let currentLevel: any = newData;
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentLevel = currentLevel[pathParts[i]];
        }
        const arrayKey = pathParts[pathParts.length - 1];
        const targetArray = currentLevel[arrayKey];
        if (targetArray && targetArray[index] !== undefined) {
          if (field) {
            targetArray[index][field] = value;
          } else {
            targetArray[index] = value;
          }
        }
        return newData;
      });
    },
    []
  );

  const handleSectionChange = useCallback(
    (deptIndex: number, secIndex: number, field: string, value: any) => {
      setFormData((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));
        updated.departments[deptIndex].sections[secIndex][field] = value;
        return updated;
      });
    },
    []
  );

  const addArrayItem = useCallback((sectionPath: string, template: any) => {
    const path = sectionPath.split(".");
    const newItem = { ...template, _tempId: Date.now() + Math.random() };
    setFormData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current: any = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      const arrayKey = path[path.length - 1];
      current[arrayKey] = [...(current[arrayKey] || []), newItem];
      return updated;
    });
  }, []);

  const removeItem = useCallback((sectionPath: string, index: number) => {
    const path = sectionPath.split(".");
    setFormData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current: any = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      const arrayKey = path[path.length - 1];
      if (current[arrayKey]) {
        current[arrayKey] = current[arrayKey].filter(
          (_: any, i: number) => i !== index
        );
      }
      return updated;
    });
  }, []);

  const sanitizeForBackend = (value: any): any => {
    if (Array.isArray(value)) {
      return value
        .map((v) => sanitizeForBackend(v))
        .filter((v) => v !== "" && v !== null && v !== undefined);
    }
    if (value && typeof value === "object") {
      const result: any = {};
      Object.entries(value).forEach(([k, v]) => {
        if (v === undefined) return;
        if (typeof v === "string") {
          const trimmed = v.trim();
          if (trimmed === "") {
            result[k] = trimmed;
            return;
          }
          if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
            result[k] = Number(trimmed);
          } else {
            result[k] = trimmed;
          }
        } else {
          result[k] = sanitizeForBackend(v);
        }
      });
      return result;
    }
    return value;
  };



 const generateJson = async () => {
    setHasAttemptedSubmit(true);
    if (!validateForm()) {
      toast.error("Please fix validation errors before saving");
      return false;
    }
    // NOTE: The outer function (generateJson or saveAndGenerate) should handle isLoading/loadingAction
    // setIsLoading(true); 
    // setLoadingAction("save");
    try {
      let payload: any = JSON.parse(JSON.stringify(formData));
      // ... sanitization logic ...
      payload = sanitizeForBackend(payload);
      const res = await axios.post(
        `${API_BASE_URL}/timetable/saveData/?course=${courseId}&year=${year}&semester=${semester}`,
        payload,
        { withCredentials: true }
      );
      toast.success("Data saved successfully!");
      setHasOrganisationData(true);
      return true;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Error saving data";
      toast.error(errorMessage);
      return false;
    } 
    // REMOVED redundant finally block here, loading state is handled by the caller
  };


  const saveAndGenerate = async () => {
    setIsLoading(true);
    setLoadingAction("saveGenerate"); // This now covers the full sequence

    try {
      const ok = await generateJson(); // generateJson no longer modifies global loading state
      
      if (!ok) {
        // If initial save failed, exit early and rely on finally to reset
        return;
      }
      
      // Continue with generation only if saving was successful
      const res = await axios.post(
        `${API_BASE_URL}/timetable/generate?course=${courseId}&year=${year}&semester=${semester}`,
        {},
        { withCredentials: true }
      );
      
      if (res.data?.data) {
        toast.success("Generation Successful");
//         navigate(
//           `/dashboard/timetable/variants/${courseId}/${year}/${semester}`
//         );
        navigate(
          `/dashboard/timetable-viewer/${courseId}/${year}/${semester}`
        );
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Error generating timetable"
      );
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };
  const resetForm = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    setIsLoading(true);
    setLoadingAction("reset");
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
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error resetting");
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const btnBase =
    "px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 w-full md:w-auto";
  const btnPrimary =
    btnBase +
    " bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300";
  const btnSecondary =
    btnBase +
    " bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400";
  const btnSuccess =
    btnBase + " bg-green-500 text-white hover:bg-green-600";
  const btnDanger = btnBase + " bg-red-500 text-white hover:bg-red-600";

  const shouldShowError = (fieldPath: string) => {
    return hasAttemptedSubmit && !!errors[fieldPath];
  };

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
      <GlobalLoader show={isLoading} />
      <div className="bg-blue-600 text-white p-4 rounded-b-xl shadow mb-6">
        <h2 className="text-xl font-semibold">
          Academic Data for Course:{" "}
          <span className="text-yellow-300">{courseId || "N/A"}</span>
        </h2>
        <p className="text-sm opacity-90">
          Year:{" "}
          <span className="text-yellow-200 font-medium">
            {year || "N/A"}
          </span>
        </p>
        <p className="text-sm opacity-90">
          Semester:{" "}
          <span className="text-yellow-200 font-medium">
            {semester || "N/A"}
          </span>
        </p>
      </div>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded mb-6 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-yellow-800">
            Large Data? Save Time!
          </h3>
          <p className="text-yellow-700 text-sm">
            Upload your existing timetable PDF and we’ll auto-fill everything
            for you.
          </p>
        </div>
        <button
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow"
          onClick={() =>
            navigate(
              `/dashboard/upload-pdf/${courseId}/${year}/${semester}`
            )
          }
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
                    handleInputChange(
                      "college_info",
                      "name",
                      e.target.value
                    )
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
                    handleInputChange(
                      "college_info",
                      "session",
                      e.target.value
                    )
                  }
                  placeholder="e.g., 2024-2025"
                />
                {shouldShowError("session") && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.session}
                  </p>
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
              {errors?.periods && (
                <p className="text-red-500 text-sm mb-2">
                  {errors.periods}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Start Time
                  </label>
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
                  <label className="block text-sm font-medium mb-1">
                    End Time
                  </label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Number of Periods
                  </label>
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
                    <option value={4}>4 Periods</option>
                    <option value={5}>5 Periods</option>
                    <option value={6}>6 Periods</option>
                    <option value={7}>7 Periods</option>
                    <option value={8}>8 Periods</option>
                    <option value={9}>9 Periods</option>
                    <option value={10}>10 Periods</option>
                    <option value={11}>11 Periods</option>
                    <option value={12}>12 Periods</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Period Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={90}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Short Break (minutes)
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    min={5}
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
                  <label className="block text-sm font-medium mb-1">
                    Lunch Break (minutes)
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    min={15}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Short Break After Period
                  </label>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Lunch Break After Period
                  </label>
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
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full mb-6"
                type="button"
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

                    // --- Validation ---
                    if (!start_time || !end_time || !periodCount || !periodDuration) {
                      alert("Please fill all required fields.");
                      return;
                    }

                    const [sh, sm] = start_time.split(":").map(Number);
                    const [eh, em] = end_time.split(":").map(Number);

                    const startMinutes = sh * 60 + sm;
                    const endMinutes = eh * 60 + em;

                    if (endMinutes <= startMinutes) {
                      alert("End time must be after start time.");
                      return;
                    }

                    // --- Configuration ---
                    const PERIOD = periodDuration || 45;
                    const SHORT = shortBreak || 10;
                    const LUNCH = lunchBreak || 30;

                    const format = (m: number) =>
                      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
                        m % 60
                      ).padStart(2, "0")}`;

                    let current = startMinutes;
                    
                    // This single array will hold Periods AND Breaks to ensure no time is skipped
                    const allSlots: {
                      id: number | string;
                      type: "period" | "shortBreak" | "lunchBreak";
                      start_time: string;
                      end_time: string;
                      duration: number;
                    }[] = [];
                    
                    const breakPeriodsIndices: number[] = [];
                    let lunchPeriodIndex: number | null = null;

                    // --- Generation Loop ---
                    for (let i = 1; i <= periodCount; i++) {
                      const periodEnd = current + PERIOD;
                      
                      // 1. Add the Teaching Period
                      // --------------------------
                      allSlots.push({
                        id: i, // ID is the period number (e.g., 1, 2, 3)
                        type: "period",
                        start_time: format(current),
                        end_time: format(periodEnd),
                        duration: PERIOD,
                      });
                      
                      current = periodEnd;

                      // 2. Check for Short Break
                      // ------------------------
                      if (i === shortBreakAfter) {
                        const breakEnd = current + SHORT;
                        
                        // Track the index where this break will live (e.g., index 2)
                        breakPeriodsIndices.push(i+1);

                        // Push the Break as an actual slot
                        allSlots.push({
                          id: `${i+1}`,
                          type: "shortBreak",
                          start_time: format(current),
                          end_time: format(breakEnd),
                          duration: SHORT,
                        });
                        i++;
                        current = breakEnd;

                        
                      }

                      // 3. Check for Lunch Break
                      // ------------------------
                      if (i === lunchBreakAfter) {
                        const lunchEnd = current + LUNCH;
                        
                        // Track the index where this lunch will live
                        lunchPeriodIndex = i+1;
                        

                        // Push the Lunch as an actual slot
                        allSlots.push({
                          id: `${i+1}`,
                          type: "lunchBreak",
                          start_time: format(current),
                          end_time: format(lunchEnd),
                          duration: LUNCH,
                        });
                        i++;
                        current = lunchEnd;
                      }
                    }

                    // --- Final Check ---
                    if (current > endMinutes) {
                      const totalDuration = current - startMinutes;
                      const hoursNeeded = Math.floor(totalDuration / 60);
                      const minsNeeded = totalDuration % 60;
                      alert(
                        `Not enough time! The schedule requires ${hoursNeeded}h ${minsNeeded}m and ends at ${format(
                          current
                        )}. Please extend End Time.`
                      );
                      return;
                    }

                    // --- Update State ---
                    setFormData({
                      ...formData,
                      time_slots: {
                        ...formData.time_slots,
                        // 'periods' now contains the FULL list (classes + breaks)
                        // This ensures 10:10-11:00 exists in the array and won't be skipped.
                        periods: allSlots, 
                        generatedSchedule: allSlots, // Preview uses the same list
                        break_periods: breakPeriodsIndices,
                        lunch_period: lunchPeriodIndex,
                      },
                    });
                  }}
              >
                Generate Time Slots
              </button>
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">
                  Generated Schedule Preview
                </h3>
                {formData.time_slots.generatedSchedule?.length > 0 ? (
                  <div className="space-y-2">
                    {formData.time_slots.generatedSchedule.map((item) => {
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
                              {isLunch
                                ? "Lunch Break"
                                : isShortBreak
                                ? "Short Break"
                                : `Period ${item.id}`}
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
              {shouldShowError("sections") && (
                <p className="text-red-500 text-sm mb-2">
                  {errors.sections}
                </p>
              )}
              <div className="space-y-6">
                {formData.departments.map((dept: any, deptIndex: number) => (
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
                              e.target.value.trim()
                            )
                          }
                          placeholder="e.g., CSE"
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
                    {shouldShowError(`dept_${deptIndex}_sections`) && (
                      <p className="text-red-500 text-xs mt-1 mb-2">
                        {errors[`dept_${deptIndex}_sections`]}
                      </p>
                    )}

                    <h4 className="font-medium mb-2 text-md">Sections</h4>
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      {dept.sections?.map((sec: any, secIndex: number) => (
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
                              {
                                name: "specialization",
                                label: "Specialization",
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
                                (_: any, i: number) => i !== secIndex
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

          {activeTab === "subjects" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Subjects</h2>
              {shouldShowError("subjects") && (
                <p className="text-red-500 text-sm mb-2">
                  {errors.subjects}
                </p>
              )}
              <div className="space-y-6">
                {formData.subjects.map((subject: any, subjectIndex: number) => (
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
                          placeholder="e.g., CSE101"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject Name{" "}
                          <span className="text-red-500">*</span>
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
                          placeholder="e.g., Mathematics"
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
                          Type [Theory or Practical]{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.type}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "type",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Theory"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Semester <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.semester}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "semester",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lecture Per Week{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.lectures_per_week}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "lectures_per_week",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Classes Per Week{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.min_classes_per_week}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "min_classes_per_week",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Classes Per Day{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`subject_${subjectIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={subject.max_classes_per_day}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "max_classes_per_day",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departments (comma separated IDs)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={subject.departments?.join(", ") || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "departments",
                              e.target.value
                                .split(",")
                                .map((s) => s.trim())
                            )
                          }
                          placeholder="e.g., CSE, IT"
                        />
                        {shouldShowError(
                          `subject_${subjectIndex}_departments`
                        ) && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`subject_${subjectIndex}_departments`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tutorial Sessions
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={subject.tutorial_sessions || 0}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "tutorial_sessions",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={subject.specialization || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "specialization",
                              e.target.value
                            )
                          }
                          placeholder="e.g., AI"
                        />
                      </div>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={!!subject.flexible_timing}
                          onChange={(e) =>
                            handleItemChange(
                              "subjects",
                              subjectIndex,
                              "flexible_timing",
                              e.target.checked
                            )
                          }
                        />
                        <span className="text-sm text-gray-700">
                          Flexible timing allowed
                        </span>
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

          {activeTab === "labs" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Labs</h2>
              {shouldShowError("labs") && (
                <p className="text-red-500 text-sm mb-2">{errors.labs}</p>
              )}
              <div className="space-y-6">
                {formData.labs.map((lab: any, labIndex: number) => (
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
                          Type
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={lab.type || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "type",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Hardware"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Credits <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.credits}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "credits",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Session Per Week{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.sessions_per_week}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "sessions_per_week",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (hours){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.duration_hours}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "duration_hours",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Semester <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`lab_${labIndex}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={lab.semester}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "semester",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departments (comma separated IDs)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={lab.departments?.join(", ") || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "departments",
                              e.target.value
                                .split(",")
                                .map((s) => s.trim())
                            )
                          }
                          placeholder="e.g., CSE, IT"
                        />
                        {shouldShowError(
                          `lab_${labIndex}_departments`
                        ) && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`lab_${labIndex}_departments`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lab Rooms (comma separated)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={lab.lab_rooms?.join(", ") || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "lab_rooms",
                              e.target.value
                                .split(",")
                                .map((s) => s.trim())
                            )
                          }
                          placeholder="e.g., L1, L2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={lab.specialization || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "labs",
                              labIndex,
                              "specialization",
                              e.target.value
                            )
                          }
                          placeholder="e.g., ML Lab"
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
                <p className="text-red-500 text-sm mb-2">
                  {errors.faculty}
                </p>
              )}
              <div className="space-y-6">
                {formData.faculty.map((member: any, index: number) => (
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
                          Faculty Name{" "}
                          <span className="text-red-500">*</span>
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
                            shouldShowError(`faculty_${index}_department`)
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
                          placeholder="e.g., CSE"
                        />
                        {shouldShowError(`faculty_${index}_department`) && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`faculty_${index}_department`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.designation}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "designation",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Assistant Professor"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subjects (comma separated IDs){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}_subjects`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.subjects?.join(", ") || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "subjects",
                              e.target.value
                                .split(",")
                                .map((s) => s.trim())
                            )
                          }
                          placeholder="e.g., CSE100, CSE200"
                        />
                        {shouldShowError(`faculty_${index}_subjects`) && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`faculty_${index}_subjects`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Hours Per Week{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.max_hours_per_week}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "max_hours_per_week",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Average Leaves Per Month
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`faculty_${index}`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={member.avg_leaves_per_month}
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "avg_leaves_per_month",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Time Slots (comma separated period IDs)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={
                            member.preferred_time_slots
                              ?.map((n: number) => String(n))
                              .join(", ") || ""
                          }
                          onChange={(e) =>
                            handleItemChange(
                              "faculty",
                              index,
                              "preferred_time_slots",
                              e.target.value
                                .split(",")
                                .map((s) => parseInt(s.trim()))
                                .filter((n) => !isNaN(n))
                            )
                          }
                          placeholder="e.g., 1, 2, 3"
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
                {formData.rooms.map((room: any, index: number) => (
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
                            shouldShowError(`room_${index}_capacity`)
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
                        {shouldShowError(`room_${index}_capacity`) && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`room_${index}_capacity`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md ${
                            shouldShowError(`room_${index}_department`)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          value={room.department}
                          onChange={(e) =>
                            handleItemChange(
                              "rooms",
                              index,
                              "department",
                              e.target.value
                            )
                          }
                          placeholder="e.g., CSE"
                        />
                        {shouldShowError(`room_${index}_department`) && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`room_${index}_department`]}
                          </p>
                        )}
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
                          <option value="conference">
                            Conference Room
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Equipment (comma separated)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md border-gray-300"
                          value={room.equipment?.join(", ") || ""}
                          onChange={(e) =>
                            handleItemChange(
                              "rooms",
                              index,
                              "equipment",
                              e.target.value
                                .split(",")
                                .map((s) => s.trim())
                            )
                          }
                          placeholder="e.g., Projector, AC"
                        />
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
            disabled={isLoading}
          >
            {loadingAction === "reset" ? "Resetting..." : "Reset Form"}
          </button>
          <button
            className={btnPrimary}
            type="button"
            onClick={generateJson}
            disabled={isLoading}
          >
            {loadingAction === "save" ? "Saving..." : "Save For Generation"}
          </button>
          <button
            className={btnPrimary}
            type="button"
            onClick={saveAndGenerate}
            disabled={isLoading}
          >
            {loadingAction === "saveGenerate"
              ? "Generating..."
              : "Save and Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganisationDataTaker;