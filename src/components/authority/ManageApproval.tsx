import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  approved: "bg-green-100 text-green-700 border-green-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
};

const ManageApprovals: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
 const navigate = useNavigate();
  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/request/all`, {
        withCredentials: true,
      });
      setRequests(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold text-blue-700">Timetable Approval Requests</h2>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        {loading ? (
          <p className="text-slate-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-slate-500">No requests found.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req._id}
                className="rounded-xl border border-slate-200 bg-blue-50/30 p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
              >
                {/* LEFT INFO */}
                <div className="space-y-2">
                  <p className="font-semibold text-blue-700 text-lg">{req.course?.toUpperCase()}</p>

                  <div className="text-slate-700 text-sm">
                    <p><span className="font-semibold">Year:</span> {req.year}</p>
                    <p><span className="font-semibold">Semester:</span> {req.semester}</p>
                    <p><span className="font-semibold">Senate:</span> {req.seneteId}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={14} />
                    <span>{new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex flex-col items-end gap-3 mt-4 md:mt-0">

                  {/* STATUS BADGE */}
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColor[req.status]}`}
                  >
                    {req.status.toUpperCase()}
                  </span>

                  {/* VIEW BUTTON */}
                  <button    
                    onClick={() =>
                      // toast.info("Open timetable viewer modal — integrate next")
                         navigate(`/authority-dashboard/manage-variants/${req.course.toLowerCase().trim()}/${req.year.toLowerCase().trim()}/${req.semester.toLowerCase()}`)
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-sm transition"
                  >
                    <Eye size={16} />
                    View Timetable
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ManageApprovals;
