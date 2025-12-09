import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "../../config";

interface TimetableData {
  [department: string]: {
    [course: string]: {
      [year: string]: {
        [semester: string]: {
          sections: any[];
          faculty: any[];
        };
      };
    };
  };
}

export default function MasterTimetable() {
  const [data, setData] = useState<TimetableData>({});
  const [loading, setLoading] = useState(true);

  const organisationId = "YOUR_ORG_ID";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/super/master/full`,{
          withCredentials:true
        }
      );
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // CSV EXPORT
  // ---------------------------
  const downloadCSV = () => {
    const rows: any[] = [];

    Object.entries(data).forEach(([dept, courses]) => {
      Object.entries(courses).forEach(([course, years]) => {
        Object.entries(years).forEach(([year, sems]) => {
          Object.entries(sems).forEach(([semester, pack]) => {
            pack.sections.forEach((sec) => {
              rows.push({
                Type: "Section",
                Department: dept,
                Course: course,
                Year: year,
                Semester: semester,
                Name: sec.section_name,
                ID: sec.section_id,
              });
            });

            pack.faculty.forEach((fac) => {
              rows.push({
                Type: "Faculty",
                Department: dept,
                Course: course,
                Year: year,
                Semester: semester,
                Name: fac.faculty_name,
                ID: fac.faculty_id,
              });
            });
          });
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Timetable");
    XLSX.writeFile(wb, "master_timetable.csv");
  };

  // ---------------------------
  // EXCEL EXPORT (.xlsx)
  // ---------------------------
  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    Object.entries(data).forEach(([dept, courses]) => {
      Object.entries(courses).forEach(([course, years]) => {
        Object.entries(years).forEach(([year, sems]) => {
          Object.entries(sems).forEach(([semester, pack]) => {
            const rows: any[] = [];

            pack.sections.forEach((sec) => {
              rows.push({
                Type: "Section",
                Name: sec.section_name,
                ID: sec.section_id,
              });
            });

            pack.faculty.forEach((fac) => {
              rows.push({
                Type: "Faculty",
                Name: fac.faculty_name,
                ID: fac.faculty_id,
              });
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(
              wb,
              ws,
              `${dept}-${course}-Y${year}-S${semester}`
            );
          });
        });
      });
    });

    XLSX.writeFile(wb, "master_timetable.xlsx");
  };

  // ---------------------------
  // PDF EXPORT
  // ---------------------------
  const downloadPDF = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("Master Timetable", 14, 15);

    let startY = 25;

    Object.entries(data).forEach(([dept, courses]) => {
      Object.entries(courses).forEach(([course, years]) => {
        Object.entries(years).forEach(([year, sems]) => {
          Object.entries(sems).forEach(([semester, pack]) => {
            pdf.setFontSize(12);
            pdf.text(
              `${dept} | ${course} | Year ${year} | Sem ${semester}`,
              14,
              startY
            );

            const rows: any[] = [];

            pack.sections.forEach((sec) =>
              rows.push(["Section", sec.section_name, sec.section_id])
            );
            pack.faculty.forEach((fac) =>
              rows.push(["Faculty", fac.faculty_name, fac.faculty_id])
            );

            autoTable(pdf, {
              startY: startY + 5,
              head: [["Type", "Name", "ID"]],
              body: rows,
            });

            startY = (pdf as any).lastAutoTable.finalY + 15;

            if (startY > 270) {
              pdf.addPage();
              startY = 20;
            }
          });
        });
      });
    });

    pdf.save("master_timetable.pdf");
  };

  // -------------------------------------
  // UI RENDER
  // -------------------------------------
  if (loading)
    return (
      <div className="w-full text-center py-10 text-xl font-semibold">
        Loading master timetable…
      </div>
    );

  return (
    <div className="p-6 w-full">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">
        Organisation Master Timetable
      </h1>

      {/* DOWNLOAD BUTTONS */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={downloadExcel}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Download Excel
        </button>

        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Download CSV
        </button>

        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Download PDF
        </button>
      </div>

      {/* DISPLAY ALL TIMETABLES */}
      <div className="space-y-6">
        {Object.entries(data).map(([dept, courses]) => (
          <div key={dept} className="border rounded p-4 bg-white shadow">
            <h2 className="text-2xl font-semibold text-blue-700">{dept}</h2>

            {Object.entries(courses).map(([course, years]) => (
              <div key={course} className="ml-4 mt-3">
                <h3 className="text-xl font-semibold text-gray-700">
                  Course: {course.toUpperCase()}
                </h3>

                {Object.entries(years).map(([year, sems]) => (
                  <div key={year} className="ml-6 mt-2">
                    <h4 className="text-lg font-medium text-gray-600">
                      Year {year}
                    </h4>

                    {Object.entries(sems).map(([semester, pack]) => (
                      <div
                        key={semester}
                        className="ml-8 p-3 border rounded bg-gray-50 mt-2"
                      >
                        <p className="font-bold">Semester {semester}</p>

                        <p className="mt-2 font-semibold">Sections</p>
                        <ul className="list-disc ml-6 text-gray-700">
                          {pack.sections.map((s, i) => (
                            <li key={i}>
                              {s.section_name} ({s.section_id})
                            </li>
                          ))}
                        </ul>

                        <p className="mt-3 font-semibold">Faculty</p>
                        <ul className="list-disc ml-6 text-gray-700">
                          {pack.faculty.map((f, i) => (
                            <li key={i}>
                              {f.faculty_name} ({f.faculty_id})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
