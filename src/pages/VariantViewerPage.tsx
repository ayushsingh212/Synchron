import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import TimeTableViewer from "./dashboard/TimTableViewer";

const CACHE_KEY = "timetable_variant_cache";

const VariantViewerPage: React.FC = () => {
    const { id: initialVariantId } = useParams<{ id: string }>();
    const [currentVariantId, setCurrentVariantId] = useState(initialVariantId);

    const [variant, setVariant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"sections" | "faculty">("sections");
    const navigate = useNavigate();

    // Load cache once
    const getCache = () => JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

    // Save variant into cache
    const updateCache = (id: string, data: any) => {
        const oldCache = getCache();
        const newCache = { ...oldCache, [id]: data };
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    };

    // Fetching function
    const fetchVariant = useCallback(async (variantId: string, fromUserAction = false) => {
        if (!variantId) return;

        setLoading(true);

        try {
            // 💡 1. Check LocalStorage first
            const cache = getCache();
            if (cache[variantId]) {
                setVariant(cache[variantId]);
                setLoading(false); // show instantly
            }

            // 💡 2. Fetch from server (always, to refresh latest)
            const res = await axios.get(
                `${API_BASE_URL}/timetable/solutions/${variantId}`,
                { withCredentials: true }
            );

            const data = res.data.data;
            setVariant(data);

            // Save latest version to cache
            updateCache(variantId, data);

            // Update URL ONLY if user manually switched variants
            if (fromUserAction) {
                navigate(`/dashboard/timetable/variant/view/${variantId}`, { replace: true });
            }

        } catch (err) {
            console.error("Error loading variant", err);
            alert("Failed to load timetable details.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Handler for switching variant inside TimetableViewer
    const handleVariantChange = useCallback((newVariantId: string) => {
        setCurrentVariantId(newVariantId);
        fetchVariant(newVariantId, true);
    }, [fetchVariant]);

    // Load initial variant
    useEffect(() => {
        if (currentVariantId) fetchVariant(currentVariantId);
    }, [currentVariantId, fetchVariant]);

    if (loading || !variant) return <p>Loading...</p>;

    const { course, year, semester, sections, faculty } = variant;

    return (
        <div className="p-5">
            <h2 className="text-xl font-semibold mb-4">
                Variant Rank {variant.rank} – {course?.toUpperCase()} / Year {year} / Sem {semester}
            </h2>

            {activeTab === "sections" ? (
                <TimeTableViewer
                    type="section"
                    data={sections}
                    course={course}
                    year={year}
                    semester={semester}
                    onVariantChange={handleVariantChange}
                />
            ) : (
                <TimeTableViewer
                    type="faculty"
                    data={faculty}
                    course={course}
                    year={year}
                    semester={semester}
                    onVariantChange={handleVariantChange}
                />
            )}
        </div>
    );
};

export default VariantViewerPage;
