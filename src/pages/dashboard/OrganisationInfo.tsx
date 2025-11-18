import React, { useState, useEffect } from "react";
import { useOrganisation } from "../../context/organisationContext";

const OrganisationInfo: React.FC = () => {
  const { organisation, setOrganisation } = useOrganisation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  useEffect(() => {
    if (organisation) setForm({ name: organisation.name, email: organisation.email });
  }, [organisation]);

  const save = async () => {
    // validate then save
    const updated = { ...organisation!, name: form.name, email: form.email };
    // TODO: persist to server
    setOrganisation(updated);
    localStorage.setItem("org", JSON.stringify(updated));
    setEditing(false);
  };

  if (!organisation) return <div>Please login to view organisation details.</div>;

  return (
    <section>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center font-bold">{organisation.name.slice(0,1)}</div>
        <div>
          <h3 className="text-lg font-semibold">{organisation.name}</h3>
          <div className="text-sm text-slate-600">{organisation.email}</div>
        </div>
        <div className="ml-auto">
          <button onClick={() => setEditing((v) => !v)} className="bg-brand-500 text-white px-3 py-1 rounded">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-6 max-w-md">
          <input value={form.name} onChange={(e) => setForm(s => ({...s, name: e.target.value}))} className="w-full border rounded px-3 py-2 mb-3" />
          <input value={form.email} onChange={(e) => setForm(s => ({...s, email: e.target.value}))} className="w-full border rounded px-3 py-2 mb-3" />
          <div className="flex gap-2">
            <button onClick={save} className="bg-brand-500 text-white px-3 py-1 rounded">Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1 border rounded">Cancel</button>
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <h4 className="font-semibold mb-3">Faculty</h4>
        <p className="text-slate-600">List of faculty and quick presence controls.</p>
        {/* This is a stub; wire with actual data */}
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-3 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">Faculty {i + 1}</div>
                <div className="text-sm text-slate-500">Subject {i + 1}</div>
              </div>
              <div>
                <button className="px-3 py-1 border rounded mr-2">Present</button>
                <button className="px-3 py-1 border rounded text-red-600">Absent</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

export default OrganisationInfo;
