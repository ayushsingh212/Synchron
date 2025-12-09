import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { API_BASE_URL } from "../../config";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface TimetableCell {
  subject?: string;
  section?: string;
  faculty?: string;
  room?: string;
  type?: string;
}

interface Timetable {
  [day: string]: {
    [period: string]: string | TimetableCell;
  };
}

interface Faculty {
  faculty_id: string;
  faculty_name: string;
  department: string;
  timetable: Timetable;
  periods: { [key: string]: string };
}

interface Section {
  section_id: string;
  section_name: string;
  specialization: string;
  timetable: Timetable;
  periods: { [key: string]: string };
}

interface CourseGroup {
  key: string;
  course: string;
  year: string;
  semester: string;
  faculty: Faculty[];
  sections: Section[];
  facultyCount: number;
  sectionsCount: number;
  totalEntries: number;
}



export default function MasterTimetableFull() {
  const [data, setData] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [generatingCSV, setGeneratingCSV] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/super/master/full`, { withCredentials: true });
      const json = res.data;
      if (json?.data?.courses) {
        setData(json.data.courses);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to load timetable data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggle = (k: string) => {
    setOpen(open === k ? null : k);
  };

  const formatCell = (cell: string | TimetableCell): string => {
    if (!cell) return "-";
    if (typeof cell === "string") return cell;
    const parts: string[] = [];
    if (cell.subject) parts.push(cell.subject);
    if (cell.faculty) parts.push(`Faculty: ${cell.faculty}`);
    if (cell.section) parts.push(`Section: ${cell.section}`);
    if (cell.room) parts.push(`Room: ${cell.room}`);
    if (cell.type) parts.push(`(${cell.type})`);
    return parts.join("\n");
  };

  const generateFullPDF = useCallback(async () => {
    if (generatingPDF || data.length === 0) return;
    try {
      setGeneratingPDF(true);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("Master Timetable - Organization", 14, 12);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${dateStr} ${timeStr}`, 14, 20);
      let currentY = 30;
      for (let groupIndex = 0; groupIndex < data.length; groupIndex++) {
        const group = data[groupIndex];
        if (groupIndex > 0) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(`${group.course} | Year ${group.year} | Semester ${group.semester}`, 14, currentY);
        currentY += 8;
        autoTable(doc, {
          startY: currentY,
          head: [["Faculty ID", "Name", "Department"]],
          body: group.faculty.map((f) => [f.faculty_id || "N/A", f.faculty_name || "N/A", f.department || "N/A"]),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
          margin: { left: 14, right: 14 },
        });
        currentY = (doc as any).lastAutoTable?.finalY || currentY + 12;
        autoTable(doc, {
          startY: currentY + 6,
          head: [["Section ID", "Section Name", "Specialization"]],
          body: group.sections.map((s) => [s.section_id || "N/A", s.section_name || "N/A", s.specialization || "N/A"]),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: "bold" },
          margin: { left: 14, right: 14 },
        });
        for (const faculty of group.faculty) {
          doc.addPage();
          currentY = 18;
          doc.setFontSize(12);
          doc.setTextColor(40);
          doc.text(`Faculty: ${faculty.faculty_name} (${faculty.faculty_id}) - ${faculty.department}`, 14, currentY);
          currentY += 6;
          const timetable = faculty.timetable || {};
          const periodsObj = faculty.periods || {};
          const periodKeys = Object.keys(periodsObj).sort((a, b) => parseInt(a) - parseInt(b));
          if (periodKeys.length > 0 && Object.keys(timetable).length > 0) {
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const header = ["Day", ...periodKeys.map((pk) => `P${pk}\n${periodsObj[pk]}`)];
            const tableData = days.map((day) => {
              const row = [day];
              periodKeys.forEach((period) => {
                const cellValue = timetable[day]?.[period];
                row.push(formatCell(cellValue));
              });
              return row;
            });
            const columnStyles: any = { 0: { cellWidth: 28, fontStyle: "bold" } };
            for (let i = 0; i < periodKeys.length; i++) columnStyles[i + 1] = { cellWidth: 42 };
            autoTable(doc, {
              startY: currentY,
              head: [header],
              body: tableData,
              styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak", cellWidth: "wrap", valign: "middle" },
              headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: "bold", fontSize: 7 },
              columnStyles,
              alternateRowStyles: { fillColor: [245, 245, 245] },
              margin: { left: 14, right: 14 },
              pageBreak: "auto",
            });
          } else {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("No timetable data available", 14, currentY);
          }
        }
        for (const section of group.sections) {
          doc.addPage();
          currentY = 18;
          doc.setFontSize(12);
          doc.setTextColor(40);
          doc.text(`Section: ${section.section_name} (${section.section_id})${section.specialization ? " - " + section.specialization : ""}`, 14, currentY);
          currentY += 6;
          const timetable = section.timetable || {};
          const periodsObj = section.periods || {};
          const periodKeys = Object.keys(periodsObj).sort((a, b) => parseInt(a) - parseInt(b));
          if (periodKeys.length > 0 && Object.keys(timetable).length > 0) {
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const header = ["Day", ...periodKeys.map((pk) => `P${pk}\n${periodsObj[pk]}`)];
            const tableData = days.map((day) => {
              const row = [day];
              periodKeys.forEach((period) => {
                const cellValue = timetable[day]?.[period];
                row.push(formatCell(cellValue));
              });
              return row;
            });
            const columnStyles: any = { 0: { cellWidth: 28, fontStyle: "bold" } };
            for (let i = 0; i < periodKeys.length; i++) columnStyles[i + 1] = { cellWidth: 42 };
            autoTable(doc, {
              startY: currentY,
              head: [header],
              body: tableData,
              styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak", cellWidth: "wrap", valign: "middle" },
              headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: "bold", fontSize: 7 },
              columnStyles,
              alternateRowStyles: { fillColor: [245, 245, 245] },
              margin: { left: 14, right: 14 },
              pageBreak: "auto",
            });
          } else {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("No timetable data available", 14, currentY);
          }
        }
      }
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      }
      doc.save(`Master_Timetable_${now.toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  }, [data, generatingPDF]);

  const generateExcel = useCallback(async () => {
    if (generatingExcel || data.length === 0) return;
    try {
      setGeneratingExcel(true);
      const wb = new ExcelJS.Workbook();
      for (const group of data) {
        const ws = wb.addWorksheet(`${group.course}_${group.year}_${group.semester}`);
        ws.addRow([`${group.course} | ${group.year} | ${group.semester}`]);
        ws.addRow([]);
        ws.addRow(["Faculty ID", "Name", "Department"]);
        for (const f of group.faculty) ws.addRow([f.faculty_id, f.faculty_name, f.department]);
        ws.addRow([]);
        ws.addRow(["Section ID", "Section Name", "Specialization"]);
        for (const s of group.sections) ws.addRow([s.section_id, s.section_name, s.specialization]);
        ws.addRow([]);
        for (const f of group.faculty) {
          ws.addRow([`Faculty: ${f.faculty_name} (${f.faculty_id}) - ${f.department}`]);
          const periodsObj = f.periods || {};
          const periodKeys = Object.keys(periodsObj).sort((a, b) => parseInt(a) - parseInt(b));
          const header = ["Day", ...periodKeys.map((pk) => `${pk} ${periodsObj[pk]}`)];
          ws.addRow(header);
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          for (const day of days) {
            const row = [day];
            for (const pk of periodKeys) {
              const cellValue = f.timetable?.[day]?.[pk];
              row.push(typeof cellValue === "string" ? cellValue : cellValue ? `${cellValue.subject || ""} ${cellValue.section || ""} ${cellValue.room || ""}` : "");
            }
            ws.addRow(row);
          }
          ws.addRow([]);
        }
        for (const s of group.sections) {
          ws.addRow([`Section: ${s.section_name} (${s.section_id})`]);
          const periodsObj = s.periods || {};
          const periodKeys = Object.keys(periodsObj).sort((a, b) => parseInt(a) - parseInt(b));
          const header = ["Day", ...periodKeys.map((pk) => `${pk} ${periodsObj[pk]}`)];
          ws.addRow(header);
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          for (const day of days) {
            const row = [day];
            for (const pk of periodKeys) {
              const cellValue = s.timetable?.[day]?.[pk];
              row.push(typeof cellValue === "string" ? cellValue : cellValue ? `${cellValue.subject || ""} ${cellValue.faculty || ""} ${cellValue.room || ""}` : "");
            }
            ws.addRow(row);
          }
          ws.addRow([]);
        }
      }
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Master_Timetable_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel:", err);
      alert("Failed to generate Excel. Please try again.");
    } finally {
      setGeneratingExcel(false);
    }
  }, [data, generatingExcel]);

  const generateCSV = useCallback(async () => {
    if (generatingCSV || data.length === 0) return;
    try {
      setGeneratingCSV(true);
      const rows: any[] = [];
      for (const group of data) {
        rows.push([`${group.course} | ${group.year} | ${group.semester}`]);
        rows.push([]);
        rows.push(["Faculty ID", "Name", "Department"]);
        for (const f of group.faculty) rows.push([f.faculty_id, f.faculty_name, f.department]);
        rows.push([]);
        rows.push(["Section ID", "Section Name", "Specialization"]);
        for (const s of group.sections) rows.push([s.section_id, s.section_name, s.specialization]);
        rows.push([]);
        for (const f of group.faculty) {
          rows.push([`Faculty: ${f.faculty_name} (${f.faculty_id}) - ${f.department}`]);
          const periodsObj = f.periods || {};
          const periodKeys = Object.keys(periodsObj).sort((a, b) => parseInt(a) - parseInt(b));
          const header = ["Day", ...periodKeys.map((pk) => `${pk} ${periodsObj[pk]}`)];
          rows.push(header);
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          for (const day of days) {
            const row = [day];
            for (const pk of periodKeys) {
              const cellValue = f.timetable?.[day]?.[pk];
              row.push(typeof cellValue === "string" ? cellValue : cellValue ? `${cellValue.subject || ""} ${cellValue.section || ""} ${cellValue.room || ""}` : "");
            }
            rows.push(row);
          }
          rows.push([]);
        }
        for (const s of group.sections) {
          rows.push([`Section: ${s.section_name} (${s.section_id})`]);
          const periodsObj = s.periods || {};
          const periodKeys = Object.keys(periodsObj).sort((a, b) => parseInt(a) - parseInt(b));
          const header = ["Day", ...periodKeys.map((pk) => `${pk} ${periodsObj[pk]}`)];
          rows.push(header);
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          for (const day of days) {
            const row = [day];
            for (const pk of periodKeys) {
              const cellValue = s.timetable?.[day]?.[pk];
              row.push(typeof cellValue === "string" ? cellValue : cellValue ? `${cellValue.subject || ""} ${cellValue.faculty || ""} ${cellValue.room || ""}` : "");
            }
            rows.push(row);
          }
          rows.push([]);
        }
      }
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `Master_Timetable_${new Date().toISOString().split("T")[0]}.csv`);
    } catch (err) {
      console.error("Error generating CSV:", err);
      alert("Failed to generate CSV. Please try again.");
    } finally {
      setGeneratingCSV(false);
    }
  }, [data, generatingCSV]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timetable data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Timetable Data</h2>
          <p className="text-gray-500">No timetable data available to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Master Timetable</h1>
            <p className="text-gray-600 mt-1">
              {data.length} course group{data.length !== 1 ? "s" : ""} • {data.reduce((acc, group) => acc + group.facultyCount, 0)} faculty members
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={generateFullPDF} disabled={generatingPDF || data.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md">
              {generatingPDF ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generating PDF...</span></> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>Download PDF</span></>}
            </button>
            <button onClick={generateExcel} disabled={generatingExcel || data.length === 0} className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md">
              {generatingExcel ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generating Excel...</span></> : <span>Download Excel</span>}
            </button>
            <button onClick={generateCSV} disabled={generatingCSV || data.length === 0} className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md">
              {generatingCSV ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Generating CSV...</span></> : <span>Download CSV</span>}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {data.map((group) => (
            <div key={group.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <button onClick={() => toggle(group.key)} className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors duration-150">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">{group.course}</h2>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Year {group.year}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Semester {group.semester}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{group.facultyCount} Faculty</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{group.sectionsCount} Sections</span>
                    </div>
                  </div>
                  <span className="text-blue-600 text-lg">{open === group.key ? "▲" : "▼"}</span>
                </div>
              </button>
              {open === group.key && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold text-blue-700 mb-3">Faculty ({group.facultyCount})</h3>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.faculty.map((f) => (
                              <tr key={f.faculty_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.faculty_id}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{f.faculty_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{f.department}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-green-700 mb-3">Sections ({group.sectionsCount})</h3>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.sections.map((s) => (
                              <tr key={s.section_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.section_id}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{s.section_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{s.specialization || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
