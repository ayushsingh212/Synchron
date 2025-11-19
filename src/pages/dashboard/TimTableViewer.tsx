import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TimeTableViewer = ({ type, data, course, year, semester }) => {
  const [index, setIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotData, setSlotData] = useState({});
  const items = Object.values(data || {});
  const item = items[index];


  const getSubjectColor = (subject) => {
    if (!subject || subject === "FREE") return "#f0f0f0";
    return "#ffe6c4";
  };

  const exportCSV = () => {
    const rows = [];
    Object.entries(item.periods).forEach(([p, time]) => {
      const row = { Time: time };
      days.forEach((day) => {
        const slot = item.timetable?.[day]?.[p] || "FREE";
        row[day] =
          typeof slot === "string" ? slot : `${slot.subject} (${slot.room}, ${slot.type})`;
      });
      rows.push(row);
    });

    const blob = new Blob([Papa.unparse(rows)], {
      type: "text/csv;charset=utf-8",
    });
    saveAs(blob, `${item.section_id || item.faculty_id}.csv`);
  };

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Timetable");

    ws.addRow(["Time", ...days]);

    Object.entries(item.periods).forEach(([p, time]) => {
      const row = [time];
      days.forEach((day) => {
        const slot = item.timetable?.[day]?.[p] || "FREE";
        row.push(
          typeof slot === "string"
            ? slot
            : `${slot.subject} (${slot.room}, ${slot.type})`
        );
      });
      ws.addRow(row);
    });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `${item.section_id || item.faculty_id}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(item.title || item.section_id || item.faculty_name, 14, 10);

    const head = ["Time", ...days];
    const rows = [];

    Object.entries(item.periods).forEach(([p, time]) => {
      const row = [time];

      days.forEach((day) => {
        const slot = item.timetable?.[day]?.[p] || "FREE";
        row.push(
          typeof slot === "string"
            ? slot
            : `${slot.subject}\n${slot.section}\n${slot.room}`
        );
      });

      rows.push(row);
    });

    autoTable(doc, { head: [head], body: rows, startY: 20 });

    doc.save(`${item.section_id || item.faculty_id}.pdf`);
  };

  // --------------------------
  // EDIT HANDLER
  const startEdit = (day, period, slot) => {
    setEditingSlot({ day, period });
    setSlotData(typeof slot === "string" ? { subject: slot } : { ...slot });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    const updatedItems = [...items];
    const updated = updatedItems[index];

    if (!updated.timetable[editingSlot.day]) {
      updated.timetable[editingSlot.day] = {};
    }

    if (slotData.subject === "FREE") {
      updated.timetable[editingSlot.day][editingSlot.period] = "FREE";
    } else {
      updated.timetable[editingSlot.day][editingSlot.period] = slotData;
    }

    // API CALL
    try {
      if (type === "faculty") {
        await axios.put(
          `${API_BASE_URL}/timetable/faculty/update?course=${course}&year=${year}&semester=${semester}&faculty_id=${updated.faculty_id}`,
          {
            timetable: updated.timetable,
            periods: updated.periods,
          },
          { withCredentials: true }
        );
      } else {
        await axios.put(
          `${API_BASE_URL}/timetable/section/update?course=${course}&year=${year}&semester=${semester}&section_id=${updated.section_id}`,
          {
            timetable: updated.timetable,
            periods: updated.periods,
          },
          { withCredentials: true }
        );
      }
    } catch (err) {
      console.log("Update error:", err.response?.data || err);
      alert("Error updating timetable");
    }

    setIsEditing(false);
  };

  if (!item) return <div>No data</div>;

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">
          {type === "faculty"
            ? `${item.faculty_name} (${item.department})`
            : `${item.section_id} - ${item.section_name}`}
        </h2>

        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn">PDF</button>
          <button onClick={exportExcel} className="btn">Excel</button>
          <button onClick={exportCSV} className="btn">CSV</button>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between mb-3">
        <button onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}>
          ← Prev
        </button>
        <span>{index + 1} / {items.length}</span>
        <button onClick={() => setIndex((i) => (i + 1) % items.length)}>
          Next →
        </button>
      </div>

      {/* TIMETABLE GRID */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[900px] table-fixed border">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th>Time</th>
              {days.map((d) => <th key={d}>{d}</th>)}
            </tr>
          </thead>

          <tbody>
            {Object.entries(item.periods).map(([p, time]) => (
              <tr key={p}>
                <td className="border p-2 bg-gray-100 font-medium">{time}</td>

                {days.map((day) => {
                  const slot = item.timetable?.[day]?.[p] || "FREE";
                  return (
                    <td
                      key={day + p}
                      className="border p-2 cursor-pointer"
                      onClick={() => startEdit(day, p, slot)}
                      style={{ backgroundColor: getSubjectColor(slot.subject) }}
                    >
                      {typeof slot === "string" ? (
                        slot
                      ) : (
                        <div>
                          <div className="font-semibold">{slot.subject}</div>
                          <div className="text-xs">{slot.section}</div>
                          <div className="text-xs">{slot.room}</div>
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

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Slot</h2>

            <div className="mb-3">
              <label>Subject</label>
              <input
                className="border p-2 w-full"
                value={slotData.subject || ""}
                onChange={(e) => setSlotData({ ...slotData, subject: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label>Section</label>
              <input
                className="border p-2 w-full"
                value={slotData.section || ""}
                onChange={(e) => setSlotData({ ...slotData, section: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label>Room</label>
              <input
                className="border p-2 w-full"
                value={slotData.room || ""}
                onChange={(e) => setSlotData({ ...slotData, room: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label>Type</label>
              <select
                className="border p-2 w-full"
                value={slotData.type || ""}
                onChange={(e) => setSlotData({ ...slotData, type: e.target.value })}
              >
                <option value="">Select type</option>
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setIsEditing(false)} className="btn bg-gray-500">Cancel</button>
              <button onClick={() => setSlotData({ subject: "FREE" })} className="btn bg-yellow-500">
                Mark Free
              </button>
              <button onClick={saveEdit} className="btn bg-blue-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTableViewer;
