import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate, useParams } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { API_BASE_URL } from "../../config";
import { useOrganisation } from "../../context/OrganisationContext";

const SectionTimeTable = () => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [sections, setSections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportType, setExportType] = useState("pdf");
  const [allExportType, setAllExportType] = useState("pdf");
  const [isNoSavedError, setIsNoSavedError] = useState(true);
  const navigate = useNavigate();
  const { hasOrganisationData, setHasOrganisationData } = useOrganisation()

  const subjectColors = {
    MATH: "#FF9AA2",
    PHYSICS: "#FFB7B2",
    CHEMISTRY: "#FFDAC1",
    BIOLOGY: "#E2F0CB",
    ENGLISH: "#B5EAD7",
    HISTORY: "#C7CEEA",
    COMPUTER: "#F8B195",
    FREE: "#F0F0F0",
    DEFAULT: "#D8BFD8",
  };

  const {courseId,semester,year} = useParams()
  const hexToRgb = useCallback((hex) => {
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }, []);


  const getContrastYIQ = useCallback((hex) => {
    hex = hex.replace(/^#/, "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? [0, 0, 0] : [255, 255, 255];
  }, []);

  const getSubjectColor = useCallback(
    (subject) => {
      if (!subject || subject === "FREE") return subjectColors.FREE;

      const subjectKey = Object.keys(subjectColors).find((key) =>
        subject.toUpperCase().includes(key)
      );

      return subjectColors[subjectKey] || subjectColors.DEFAULT;
    },
    [subjectColors]
  );
  const fetchSavedTimtable = async () => {
   
    console.log("here are the things",courseId,year,semester)
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/timetable/sectionTimeTable/getSpecific?course=${courseId}&year=${year}&semester=${semester}`, {
        withCredentials: true,
      });

      if (res.data?.data) {
        setSections(Object.values(res.data.data.sections));
      } else {
        setError("No Organistaion data saved yet! Save First");
        setIsNoSavedError(true);
      }
    } catch (error) {
      setError("No Organistaion data saved yet! Save First");
    }
    finally {
      setLoading(false)
    }
  }
 


  const exportAllToCSV = useCallback(() => {
    if (!sections || !sections.length) {
      console.warn("No sections available to export");
      alert("No sections available to export");
      return;
    }

    const rows = [];

    sections.forEach((section) => {
      // Section title row
      rows.push([
        `Timetable for ${section.section_name} Semester(${section.semester})`,
      ]);
      rows.push([`Generated on ${new Date().toLocaleDateString()}`]);

      // Table header
      const tableColumn = ["Time", ...days];
      rows.push(tableColumn);

      // Table body
      Object.entries(section.periods || {}).forEach(([periodNum, time]) => {
        const row = [time];
        days.forEach((day) => {
          const slot = section.timetable?.[day]?.[periodNum] ?? "FREE";
          if (typeof slot === "string") {
            row.push(slot);
          } else if (slot && slot.subject) {
            row.push(
              `${slot.subject} | ${slot.section || ""} | ${slot.room || ""} | ${slot.type || ""
              }`
            );
          } else {
            row.push("FREE");
          }
        });
        rows.push(row);
      });

      // Empty row for spacing between sections
      rows.push([]);
    });

    // Convert rows to CSV
    const csv = Papa.unparse(rows);

    // Download file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "All-Sections-Timetables.csv");
  }, [sections, days]);

  // ── EXCEL for ALL sections ──
  const exportAllToExcel = useCallback(async () => {
    if (!sections || !sections.length) {
      console.warn("No sections available to export");
      alert("No sections available to export");
      return;
    }

    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();

      // Create worksheets for each section
      sections.forEach((section, index) => {
        const worksheet = workbook.addWorksheet(`Section-${index + 1}`);

        // Add title and metadata rows
        worksheet.addRow([
          `Timetable for ${section.section_name} Semester(${section.semester})`,
        ]);
        worksheet.addRow([`Generated on ${new Date().toLocaleDateString()}`]);
        worksheet.addRow([]); // Empty row for spacing

        // Create header row
        const headerRow = ["Time", ...days];
        worksheet.addRow(headerRow);

        // Style header row
        const headerFont = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.forEach((_, colIndex) => {
          const cell = worksheet.getCell(4, colIndex + 1);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4287F5" },
          };
          cell.font = headerFont;
        });

        // Add timetable data
        Object.entries(section.periods).forEach(([periodNum, time]) => {
          const row = [time];

          days.forEach((day) => {
            const slot = section.timetable[day]?.[periodNum] || "FREE";
            if (typeof slot === "string") {
              row.push(slot);
            } else {
              row.push(
                `${slot.subject} (${slot.section}, ${slot.room}, ${slot.type})`
              );
            }
          });

          worksheet.addRow(row);
        });

        // Set column widths for better readability
        worksheet.columns = [
          { width: 10 }, // Time column
          ...days.map(() => ({ width: 25 })), // Day columns
        ];
      });

      // Generate Excel file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "All-Sections-Timetables.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  }, [sections, days]);

  const exportAllToPDF = useCallback(() => {
    if (!sections || !sections.length) {
      console.warn("No sections available to export");
      alert("No sections available to export");
      return;
    }

    const doc = new jsPDF();

    sections.forEach((section, index) => {
      if (index > 0) doc.addPage(); // New page for each section

      // Title
      doc.setFontSize(18);
      doc.text(
        `Timetable for ${section.section_name}  Semester(${section.semester})`,
        14,
        15
      );
      doc.setFontSize(12);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);

      // Table Data
      const tableColumn = ["Time", ...days];
      const tableRows = [];

      Object.entries(section.periods).forEach(([periodNum, time]) => {
        const row = [time];
        days.forEach((day) => {
          const slot = section.timetable[day]?.[periodNum] || "FREE";
          if (typeof slot === "string") {
            row.push(slot);
          } else {
            row.push(
              `${slot.subject}\n${slot.section}\n${slot.room}\n${slot.type}`
            );
          }
        });
        tableRows.push(row);
      });

      // Table with subject colors
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 135, 245] },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index > 0) {
            const subjectText = data.cell.raw;
            const firstLine = subjectText.split("\n")[0];
            const bgColor = getSubjectColor(firstLine);
            data.cell.styles.fillColor = hexToRgb(bgColor);
            data.cell.styles.textColor = getContrastYIQ(bgColor);
          }
        },
      });
    });

    doc.save(`All-Sections-Timetables.pdf`);
  }, [sections, days, getSubjectColor, hexToRgb, getContrastYIQ]);

  const exportSectionToExcel = useCallback(
    async (sectionData) => {
      if (!sectionData) return;

      try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sectionData.section_name);

        // Header Row with styling
        const headerRow = worksheet.addRow(["Time", ...days]);
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4287F5" },
          };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        });

        // Data Rows
        Object.entries(sectionData.periods).forEach(([periodNum, time]) => {
          const row = [time];
          days.forEach((day) => {
            const slot = sectionData.timetable[day]?.[periodNum] || "FREE";
            if (typeof slot === "string") {
              row.push(slot);
            } else {
              row.push(`${slot.subject} (${slot.room}, ${slot.type})`);
            }
          });
          worksheet.addRow(row);
        });

        // Set column widths
        worksheet.columns = [
          { width: 10 }, // Time column
          ...days.map(() => ({ width: 25 })), // Day columns
        ];

        // Generate and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, `${sectionData.section_name}_timetable.xlsx`);
      } catch (error) {
        console.error("Error exporting section to Excel:", error);
        alert("Failed to export section to Excel. Please try again.");
      }
    },
    [days]
  );

  const exportSectionToCSV = useCallback(
    (sectionData) => {
      if (!sectionData) return;

      const rows = [];

      Object.entries(sectionData.periods).forEach(([periodNum, time]) => {
        const row = { Time: time };
        days.forEach((day) => {
          const slot = sectionData.timetable[day]?.[periodNum] || "FREE";
          if (typeof slot === "string") {
            row[day] = slot;
          } else {
            row[day] = `${slot.subject} (${slot.room}, ${slot.type})`;
          }
        });
        rows.push(row);
      });

      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `${sectionData.section_name}_timetable.csv`);
    },
    [days]
  );

  const exportSectionToPDF = useCallback(() => {
    const section = sections[currentIndex];
    if (!section) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(
      `Timetable for ${section.section_name} Semester : (${section.semester})`,
      14,
      15
    );
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);

    // Table Data
    const tableColumn = ["Time", ...days];
    const tableRows = [];

    Object.entries(section.periods).forEach(([periodNum, time]) => {
      const row = [time];
      days.forEach((day) => {
        const slot = section.timetable[day]?.[periodNum] || "FREE";
        if (typeof slot === "string") {
          row.push(slot);
        } else {
          row.push(
            `${slot.subject}\n${slot.section}\n${slot.room}\n${slot.type}`
          );
        }
      });
      tableRows.push(row);
    });

    // Table with subject colors
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 135, 245] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index > 0) {
          const subjectText = data.cell.raw;
          const firstLine = subjectText.split("\n")[0];
          const bgColor = getSubjectColor(firstLine);
          data.cell.styles.fillColor = hexToRgb(bgColor);
          data.cell.styles.textColor = getContrastYIQ(bgColor);
        }
      },
    });

    // Save
    doc.save(`Timetable-${section.section_name.replace(/\s+/g, "-")}.pdf`);
  }, [sections, currentIndex, days, getSubjectColor, hexToRgb, getContrastYIQ]);

  const handleSingleExport = useCallback(() => {
    const section = sections[currentIndex];
    if (!section) return;

    switch (exportType) {
      case "pdf":
        exportSectionToPDF();
        break;
      case "excel":
        exportSectionToExcel(section);
        break;
      case "csv":
        exportSectionToCSV(section);
        break;
      default:
        console.warn("No export type selected");
    }
  }, [
    sections,
    currentIndex,
    exportType,
    exportSectionToPDF,
    exportSectionToExcel,
    exportSectionToCSV,
  ]);

  const handleAllExport = useCallback(() => {
    switch (allExportType) {
      case "pdf":
        exportAllToPDF();
        break;
      case "excel":
        exportAllToExcel();
        break;
      case "csv":
        exportAllToCSV();
        break;
      default:
        console.warn("No export type selected");
    }
  }, [allExportType, exportAllToPDF, exportAllToExcel, exportAllToCSV]);

  useEffect(() => {
    fetchSavedTimtable()
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + sections.length) % sections.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sections.length);
  };

  const handleEdit = (day, periodNum, slot) => {
    setEditingSlot({ day, periodNum });
    setFormData(typeof slot === "string" ? { subject: slot } : { ...slot });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "section") {
      navigate(`/dashboard/sectionTimeTable/${courseId}/${year}/${semester}`);
    } else if (value === "faculty") {
      navigate(`/dashboard/facultyTimeTable/${courseId}/${year}/${semester}`);
    }
  };

  const handleSave = async () => {
    if (!editingSlot) return;
    console.log("I am the save");
    const updatedSections = [...sections];

    console.log("Here is the updated Sections", updatedSections);

    const section = updatedSections[currentIndex];

    if (!section.timetable[editingSlot.day]) {
      section.timetable[editingSlot.day] = {};
    }

    if (formData.subject === "FREE") {
      section.timetable[editingSlot.day][editingSlot.periodNum] = "FREE";
    } else {
      section.timetable[editingSlot.day][editingSlot.periodNum] = {
        ...formData,
      };
    }

    console.log(
      "here is that particular section",
      updatedSections[currentIndex]
    );

    try {
      const res = await axios.put(
        `${API_BASE_URL}/timetable/sectionUpdate`,
        
           updatedSections[currentIndex],
        
        {
          withCredentials: true,
        }
      );

      console.log("I worked here", res);
    } catch (error) {
      console.log("Here error while updating the api", error);
    }

    setSections(updatedSections);
    setIsEditing(false);
    setEditingSlot(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Generating and loading Section timetables...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
       
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            No Section Timetable Found
          </h2>

          <p className="text-gray-600 mt-2">
            It looks like no section data has been added yet. Add a Section
            to generate their timetable.
          </p>

          <button
            onClick={() => navigate("/dashboard/organisation-data-taker")}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md"
          >
            Add Faculty
          </button>
        </div>
      </div>
    );
  }

  const section = sections[currentIndex];
  const periods = section.periods;
  const timetable = section.timetable;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-4 px-2">
      <div className="w-full max-w-[1400px] bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
        {/* HEADER CONTROLS (Applied from example) */}
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center mb-6">
          {/* Left Section: Selects & Title */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="timetableType"
                className="text-lg font-semibold text-gray-700"
              >
                📅 Timetable View:
                <div>{year?.toUpperCase()}-{courseId?.toUpperCase()}-{semester?.toUpperCase()}</div>
              </label>
              <select
                id="timetableType"
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
                onChange={handleChange}
                value="section" // Set to section
              >
                <option value="faculty">Faculty Timetable</option>
                <option value="section">Section Timetable</option>
              </select>
            </div>
            <h3 className="text-xl font-bold text-blue-700">
              {section.section_name}{" "}
              <span className="text-gray-500 text-sm">
                (Semester: {section.semester})
              </span>
            </h3>
          </div>

          {/* RIGHT EXPORT BUTTONS - Stacks on Mobile (Applied from example) */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {/* Single Download Group */}
            <div className="flex gap-2 bg-gray-50 p-2 rounded-lg border">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleSingleExport}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 whitespace-nowrap"
              >
                Download Current
              </button>
            </div>

            {/* Download All Group */}
            <div className="flex gap-2 bg-gray-50 p-2 rounded-lg border">
              <select
                value={allExportType}
                onChange={(e) => setAllExportType(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleAllExport}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 whitespace-nowrap"
              >
                Download All
              </button>
            </div>

          </div>
        </div>

        {/* NAVIGATION (Prev/Next) (Applied from example) */}
        <div className="flex items-center justify-between gap-3 mb-4 bg-gray-100 p-3 rounded-lg shadow-inner">
          <button
            onClick={handlePrev}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition text-sm md:text-base"
          >
            &larr; Prev
          </button>

          <span className="font-semibold text-gray-700 text-sm md:text-base">
            Page {currentIndex + 1} of {sections.length}
          </span>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition text-sm md:text-base"
          >
            Next &rarr;
          </button>
        </div>

        <div className="w-full overflow-x-auto border rounded-lg shadow-sm">
          <div className="min-w-[800px] lg:min-w-full grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200">
            {/* Header Row */}
            <div className="bg-blue-600 p-3 font-semibold text-center text-white text-sm uppercase tracking-wide">
              Time
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="bg-blue-600 p-3 font-semibold text-center text-white text-sm uppercase tracking-wide"
              >
                {day}
              </div>
            ))}

            {/* Body Rows */}
            {Object.entries(periods).map(([periodNum, time]) => (
              <React.Fragment key={periodNum}>
                {/* Time Column */}
                <div className="p-3 border-b text-sm bg-gray-50 text-center font-medium text-gray-600 flex items-center justify-center">
                  {time}
                </div>

                {/* Days Columns (Cell styling from example) */}
                {days.map((day) => {
                  const slot = timetable[day]?.[periodNum] || "FREE";
                  const backgroundColor = getSubjectColor(
                    typeof slot === "string" ? slot : slot.subject
                  );

                  return (
                    <div
                      key={day + periodNum}
                      className="p-2 border-b text-center text-sm cursor-pointer hover:opacity-80 transition flex flex-col items-center justify-center min-h-[80px]"
                      style={{ backgroundColor }}
                      onClick={() => handleEdit(day, periodNum, slot)}
                    >
                      {typeof slot === "string" ? (
                        <span className="text-gray-600 font-medium">
                          {slot}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1 w-full">
                          <span className="font-bold text-gray-900 text-xs md:text-sm leading-tight break-words">
                            {slot.subject}
                          </span>
                          <div className="flex justify-center gap-1 flex-wrap">
                            <span className="text-[10px] md:text-xs px-1 rounded text-gray-800">
                              {slot.section}
                            </span>
                            <span className="text-[10px] md:text-xs px-1 rounded text-blue-800 font-semibold">
                              {slot.room}
                            </span>
                          </div>
                          <span className="text-[10px] italic text-gray-600">
                            {slot.type}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="md:hidden text-center text-xs text-gray-400 mt-2 italic">
          &larr; Scroll horizontally to view full timetable &rarr;
        </div>
      </div>

      {/* Edit Modal (Left unchanged, as it's a popup) */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Edit Timetable Slot
              </h3>
              <div className="mb-2 text-sm text-gray-600">
                Editing {editingSlot.day}, Period {editingSlot.periodNum}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter section"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter room"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingSlot(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ subject: "FREE" });
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Mark as Free
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionTimeTable;
