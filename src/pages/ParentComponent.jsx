// ParentComponent.jsx
import React, { useState, useEffect } from "react";
import TimeTableViewer from "./TimeTableViewer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ParentComponent = () => {
  const [timetableData, setTimetableData] = useState({});
  const [variants, setVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState(0);
  const [viewType, setViewType] = useState("section"); // "section" or "faculty"
  const [isLoading, setIsLoading] = useState(false);

  // Course information (this would come from your app state/params)
  const courseInfo = {
    course: "b.tech",
    year: "2nd",
    semester: "3rd",
    organisation_id: "your-org-id-here"
  };

  // Initial load of timetable data
  useEffect(() => {
    loadInitialTimetable();
  }, []);

  const loadInitialTimetable = async () => {
    setIsLoading(true);
    try {
      // Fetch initial timetable data from your API
      const response = await fetch(`${API_BASE_URL}/api/timetables/sections`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimetableData(data);
        
        // If you have variants, set them
        if (data.variants) {
          setVariants(data.variants);
        }
      }
    } catch (error) {
      console.error("Failed to load timetable:", error);
      toast.error("Failed to load timetable");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle timetable regeneration after NLP update
  const handleTimetableRegenerate = (newData, newVariants) => {
    setTimetableData(newData);
    setVariants(newVariants || []);
    setCurrentVariant(0);
    toast.success("Timetable updated successfully!");
  };

  // Handle variant change
  const handleVariantChange = (variantIndex) => {
    setCurrentVariant(variantIndex);
    
    // Fetch data for the selected variant
    fetchVariantData(variantIndex);
  };

  const fetchVariantData = async (variantIndex) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/timetables/solutions/${variantIndex}`,
        { credentials: "include" }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTimetableData(data);
      }
    } catch (error) {
      console.error("Failed to fetch variant data:", error);
    }
  };

  // Toggle between section and faculty view
  const toggleViewType = () => {
    setViewType(viewType === "section" ? "faculty" : "section");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Timetable Management</h1>
          <p className="text-gray-600">
            {courseInfo.course.toUpperCase()} • Year {courseInfo.year} • Semester {courseInfo.semester}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={toggleViewType}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Switch to {viewType === "section" ? "Faculty View" : "Section View"}
          </button>
          
          <button
            onClick={loadInitialTimetable}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* TimetableViewer */}
      <TimeTableViewer
        type={viewType}
        data={timetableData}
        course={courseInfo.course}
        year={courseInfo.year}
        semester={courseInfo.semester}
        organisation_id={courseInfo.organisation_id}
        onVariantChange={handleVariantChange}
        onTimetableRegenerate={handleTimetableRegenerate}
        currentVariant={currentVariant}
        totalVariants={variants.length || 1}
      />

      {/* Stats */}
      {Object.keys(timetableData).length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-semibold mb-3">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(timetableData).length}
              </div>
              <div className="text-sm text-gray-600">
                {viewType === "section" ? "Sections" : "Faculty"}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold text-green-600">
                {variants.length}
              </div>
              <div className="text-sm text-gray-600">Available Variants</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold text-purple-600">
                {currentVariant + 1}
              </div>
              <div className="text-sm text-gray-600">Current Variant</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-2xl font-bold text-orange-600">
                {new Date().toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentComponent;