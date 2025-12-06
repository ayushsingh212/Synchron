import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
// 💡 ADD useNavigate to your imports
import { Link, useParams, useNavigate } from "react-router-dom"; 

interface VariantSummary {
  _id: string;
  rank: number;
  fitness: number;
  total_sections: number;
  total_faculty: number;
}

const VariantListPage: React.FC = () => {
 
  const {courseId,year,semester} = useParams<{courseId: string, year: string, semester: string}>();
  // 💡 Initialize useNavigate
  const navigate = useNavigate();

  const [variants, setVariants] = useState<VariantSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Use useCallback for fetchVariants to maintain stability in useEffect
  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/timetable/solutions?course=${courseId}&year=${year}&semester=${semester}`,
        { withCredentials: true }
      );
      setVariants(res.data.data.solutions);
      console.log("Here is the res",res)
    } catch (err) {
      console.error("Error fetching variants", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, year, semester]); // Added dependencies for useCallback

  // 💡 MODIFIED: Added navigation after successful approval
  const approveVariant = async (id: string) => {
    if (!window.confirm("Approve this timetable?")) return;
    try {
      await axios.post(
        `${API_BASE_URL}/timetable/solutions/approve`,
        { solutionId: id },
        { withCredentials: true }
      );
      
      alert("Timetable Approved Successfully! Navigating to view the approved variant.");
      
      
      navigate(`/dashboard/timetables`);

      
      
    } catch (err) {
      alert("Error approving timetable");
      console.error("Approval error:", err);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]); // Dependency updated to use memoized fetchVariants

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Generated Variants – {courseId?.toUpperCase() || 'N/A'} / Year {year} / Sem {semester}
      </h2>

      <div className="grid gap-4">
        {variants.map((v) => (
          <div
            key={v._id}
            className="p-5 border rounded-lg bg-white shadow-sm flex justify-between items-center"
          >
            <div>navigati
              <p className="font-semibold">Variant Rank {v.rank}</p>
              <p className="text-sm text-gray-600">Fitness: {v.fitness.toFixed(2)}</p>
              <p className="text-sm text-gray-600">
                Sections: {v.total_sections} | Faculty: {v.total_faculty}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to={`/dashboard/timetable/variant/view/${v._id}`}
                className="px-4 py-2 border rounded-lg"
              >
                View
              </Link>
              <button
                onClick={() => approveVariant(v._id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantListPage;