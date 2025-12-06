import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // 💡 Added useNavigate
import TimeTableViewer from "./dashboard/TimTableViewer"; // Correct path assumed

const VariantViewerPage: React.FC = () => {
    // 💡 Use the variantId from the URL as the starting point
    const { id: initialVariantId } = useParams<{ id: string }>(); 
    
    // New state to manage the ID currently being displayed (defaults to URL param)
    const [currentVariantId, setCurrentVariantId] = useState(initialVariantId); 
    
    const [variant, setVariant] = useState<any>(null);
    const [loading, setLoading] = useState(true); // Added loading state
    const [activeTab, setActiveTab] = useState<"sections" | "faculty">("sections");
    const navigate = useNavigate(); // For navigating back to the rank list page
    
    // Use useCallback to stabilize the fetch function for useEffect
    const fetchVariant = useCallback(async (variantId: string) => {
        if (!variantId) return;

        setLoading(true);
        try {
            // Fetch detailed data for the specified variantId
            const res = await axios.get(`${API_BASE_URL}/timetable/solutions/${variantId}`, {
                withCredentials: true,
            });
            
            // Set the new variant data
            setVariant(res.data.data);
            
            // 💡 Ensure the URL is updated to reflect the current variant being viewed
            // This prevents issues if the user refreshes the page later.
            if (variantId !== initialVariantId) {
                 // Use replace to update history without adding a new entry
                 navigate(`/dashboard/timetable/variant/view/${variantId}`, { replace: true });
            }

        } catch (err) {
            console.error("Error loading variant", err);
            alert("Failed to load timetable details for this variant.");
            setVariant(null);
        } finally {
            setLoading(false);
        }
    }, [initialVariantId, navigate]);

    // 💡 1. Handler function to receive new variant ID from TimeTableViewer (modal)
    const handleVariantChange = useCallback((newVariantId: string) => {
        // Update the state and trigger the data fetch
        setCurrentVariantId(newVariantId);
        fetchVariant(newVariantId);
    }, [fetchVariant]);


    useEffect(() => {
        // Use currentVariantId state which is set initially from URL/user interaction
        if (currentVariantId) {
            fetchVariant(currentVariantId);
        }
    }, [currentVariantId, fetchVariant]); // Dependency on currentVariantId and fetchVariant

    // Check loading/no data state
    if (loading || !variant) return <p>Loading...</p>;

    const { course, year, semester, sections, faculty } = variant;
    
    // Ensure data structures (sections, faculty) are safe before passing
    const sectionData = sections || {};
    const facultyData = faculty || {};

    return (
        <div className="p-5">
            <h2 className="text-xl font-semibold mb-4">
                Variant Rank {variant.rank} – {course?.toUpperCase() || 'N/A'} / Year {year || 'N/A'} / Sem {semester || 'N/A'}
            </h2>

            <div className="flex gap-3 mb-4">
                {/* Tab buttons */}
            </div>

            {/* Pass the handler down to the TimeTableViewer */}
            {activeTab === "sections" ? (
                <TimeTableViewer
                    type="section"
                    data={sectionData}
                    course={course}
                    year={year}
                    semester={semester}
                    onVariantChange={handleVariantChange} // 💡 Passed the new handler
                />
            ) : (
                <TimeTableViewer
                    type="faculty"
                    data={facultyData}
                    course={course}
                    year={year}
                    semester={semester}
                    onVariantChange={handleVariantChange} // 💡 Passed the new handler
                />
            )}
        </div>
    );
};

export default VariantViewerPage;