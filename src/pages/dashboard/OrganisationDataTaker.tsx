import React, { useState } from "react";

/**
 * This page guides admin through creating the input dataset:
 * - Select course
 * - Select year
 * - Add sections and faculty mapping
 * - Save as draft
 *
 * For production: use server validation and incremental saves
 */

const OrganisationDataTaker: React.FC = () => {
  const [course, setCourse] = useState("B.Tech");
  const [year, setYear] = useState("1");
  const [sections, setSections] = useState([{ id: "A" }, { id: "B" }]);
  const [faculty, setFaculty] = useState([{ name: "", subject: "" }]);

  const addSection = () => setSections((s) => [...s, { id: `S${s.length + 1}` }]);
  const addFaculty = () => setFaculty((f) => [...f, { name: "", subject: "" }]);

  return (
    <section className="space-y-6">
      <h3 className="font-semibold">Course & Year</h3>
      <div className="flex gap-3">
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="border px-3 py-2 rounded">
          <option>B.Tech</option>
          <option>M.Tech</option>
          <option>BSc</option>
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="border px-3 py-2 rounded">
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>
      </div>

      <div>
        <h4 className="font-medium mb-2">Sections</h4>
        <div className="grid gap-2">
          {sections.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input value={s.id} onChange={(e) => {
                const copy = [...sections]; copy[idx].id = e.target.value; setSections(copy);
              }} className="border px-2 py-1 rounded" />
            </div>
          ))}
          <button onClick={addSection} className="mt-2 px-3 py-1 border rounded">Add section</button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Faculty Mapping</h4>
        <div className="grid gap-2">
          {faculty.map((f, idx) => (
            <div className="flex gap-2" key={idx}>
              <input value={f.name} onChange={(e) => { const copy = [...faculty]; copy[idx].name = e.target.value; setFaculty(copy); }} placeholder="Name" className="border px-2 py-1 rounded flex-1" />
              <input value={f.subject} onChange={(e) => { const copy = [...faculty]; copy[idx].subject = e.target.value; setFaculty(copy); }} placeholder="Subject" className="border px-2 py-1 rounded flex-1" />
            </div>
          ))}
          <button onClick={addFaculty} className="mt-2 px-3 py-1 border rounded">Add faculty</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="bg-brand-500 text-white px-4 py-2 rounded">Generate Draft</button>
        <button className="px-4 py-2 border rounded">Save Draft</button>
      </div>
    </section>
  );
};

export default OrganisationDataTaker;
