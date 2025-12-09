import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { Trash2, UserPlus } from "lucide-react";

const AssignSenete: React.FC = () => {
  const [senates, setSenates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    senateId: "",
    password: ""
  });

  const fetchSenates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/senates/listSenates`, {
        withCredentials: true
      });
      setSenates(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load senetes");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSenate = async () => {
    if (!form.senateId || !form.password)
      return toast.error("Both fields are required");

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/senates/addSenate`,
        form,
        { withCredentials: true }
      );

      toast.success("HOD ASSIGNED successfully");
      setForm({ senateId: "", password: "" });
      fetchSenates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error creating senete");
    } finally {
      setLoading(false);
    }
  };

  const removeSenate = async (senateId: string) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/senates/removeSenate/${senateId}`,
        { withCredentials: true }
      );

      toast.success("HOD unassigned");
      fetchSenates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error removing senete");
    }
  };

  useEffect(() => {
    fetchSenates();
  }, []);

  return (
    <div className="space-y-10">

      <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
          <UserPlus size={20} /> Assign New HOD
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="senateId"
            placeholder="Enter HOD MAIL"
            value={form.senateId}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Allot a  Password"
            value={form.password}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button
          onClick={addSenate}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Assign HOD"}
        </button>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Assigned Senetes</h2>

        {senates.length === 0 ? (
          <p className="text-slate-500">No HOD assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {senates.map((s: any) => (
              <div
                key={s.senateId}
                className="flex items-center justify-between bg-slate-100 p-4 rounded-lg border border-slate-200"
              >
                <span className="font-medium text-slate-700">{s.senateId}</span>

                <button
                  onClick={() => removeSenate(s.senateId)}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AssignSenete;
