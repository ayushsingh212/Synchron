import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useOrganisation } from "../../context/OrganisationContext";
import { Pencil, Trash2, Check, X, Upload } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmModal from "../../modals/ConfirmModal";

const OrganisationInfo: React.FC = () => {
  const { organisation, setOrganisation, getOrganisation } = useOrganisation();

  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    organisationName: "",
    organisationEmail: ""
  });

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrg = async () => {
    const data = await getOrganisation();
    if (data) {
      setOrganisation(data);
      setForm({
        organisationName: data.organisationName,
        organisationEmail: data.organisationEmail
      });
    }
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const save = () => {
    // NOTE: This function only updates local state/storage. A backend API call is typically required here.
    const updated = {
      ...organisation!,
      organisationName: form.organisationName,
      organisationEmail: form.organisationEmail
    };
    setOrganisation(updated);
    localStorage.setItem("org", JSON.stringify(updated));
    setEditing(false);
  };

  const updateAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);

      const res = await axios.post(
        `${API_BASE_URL}/organisation/update-avatar`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );

      toast.success("Avatar updated");
      setOrganisation(res.data.data);
    } catch {
      toast.error("Failed to update avatar");
    } finally {
      setUploading(false);
    }
  };

  const deleteOrganisation = async () => {
    try {
      setDeleting(true);

      await axios.delete(`${API_BASE_URL}/organisation/delete`, {
        withCredentials: true
      });

      toast.success("Organisation deleted");
      // Assuming this redirects to the login/home page
      window.location.href = "/"; 
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!organisation) return <div className="text-blue-600">Loading...</div>;

  return (
    <div className="space-y-8 sm:space-y-10">
      
      <div className="bg-white border border-blue-200 rounded-2xl shadow-md p-6 flex flex-col items-center gap-4 sm:flex-row sm:gap-6 sm:items-start">
        
        <label className="relative cursor-pointer flex-shrink-0">
          <img
            src={organisation.avatar}
            alt=""
            className="w-24 h-24 sm:w-20 sm:h-20 rounded-full border border-blue-300 object-cover"
          />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files && updateAvatar(e.target.files[0])}
          />
          <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full">
            <Upload size={16} />
          </div>
        </label>

        
        <div className="text-center sm:text-left flex-grow">
          <div className="text-xl sm:text-2xl font-bold text-blue-700">
            {organisation.organisationName}
          </div>
          <div className="text-sm sm:text-base text-slate-600">
            {organisation.organisationEmail}
          </div>
        </div>

       
        <div className="mt-2 sm:mt-0 sm:ml-auto flex gap-3">
          <button
            onClick={() => setEditing(!editing)}
            className="p-2 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
          >
            {editing ? <X size={18} /> : <Pencil size={18} />}
          </button>

          <button
            onClick={()=>setShowConfirm(true)}
            disabled={deleting}
            className="p-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
           <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={deleteOrganisation}
        title="Delete Organisation?"
        message="This action cannot be undone. Do you really want to delete your organisation?"
        confirmText="Delete"
        cancelText="Cancel"
      />
        </div>
      </div>

    
      {editing && (
        <div className="bg-white border border-blue-200 shadow rounded-xl p-6 w-full sm:max-w-md">
          <div className="space-y-4">
            <input
              value={form.organisationName}
              onChange={(e) =>
                setForm({ ...form, organisationName: e.target.value })
              }
              className="w-full border border-blue-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Organisation Name"
            />

            <input
              value={form.organisationEmail}
              onChange={(e) =>
                setForm({ ...form, organisationEmail: e.target.value })
              }
              className="w-full border border-blue-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Organisation Email"
            />

            <div className="flex gap-3">
              <button
            
    onClick={save}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
              >
                <div className="flex items-center justify-center gap-2">
                  <Check size={16} />
                  Save
                </div>
              </button>

              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border rounded-lg w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    
      <div>
        <h4 className="text-lg font-semibold text-blue-700 mb-3">
          Faculty Members
        </h4>

        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-blue-100 shadow rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
             
              <div>
                <div className="font-semibold text-blue-700">
                  Faculty {i + 1}
                </div>
                <div className="text-sm text-slate-600">Subject {i + 1}</div>
              </div>

              
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="px-3 py-1 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 w-1/2 sm:w-auto">
                  Present
                </button>
                <button className="px-3 py-1 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 w-1/2 sm:w-auto">
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrganisationInfo;