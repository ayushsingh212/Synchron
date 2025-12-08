import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import Papa from "papaparse";

// Days array
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- Variant Rank Selector Modal ---
const VariantRankModal = ({ 
  variants, 
  onClose, 
  onSelectVariant, 
  course, 
  year, 
  semester,
  onApproveVariant,
  approvedVariantId 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Select Timetable Variant 
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-light">
            &times;
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Showing solutions for: {course?.toUpperCase()} / Year {year} / Semester {semester}
        </p>

        <div className="space-y-4">
          {variants.length === 0 ? (
            <p className="text-gray-500 p-4 text-center">No variants found. Generate a timetable first.</p>
          ) : (
            variants.map((variant, index) => (
              <div 
                key={variant._id || index}
                className={`p-4 border rounded-lg ${variant._id === approvedVariantId ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'} hover:bg-blue-50 transition cursor-pointer`}
                onClick={() => onSelectVariant(variant)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg">
                        Variant #{variant.rank || index + 1}
                        {variant._id === approvedVariantId && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            ✅ Approved
                          </span>
                        )}
                      </p>
                      {variant.isApproved && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Approved
                        </span>
                      )}
                    </div>
                      
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-sm">
                        <span className="font-medium">Fitness Score:</span>
                        <span className="ml-2 text-blue-600 font-bold">
                          {variant.fitness?.toFixed(2) || variant.statistics?.fitness_score?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Sections:</span>
                        <span className="ml-2">
                          {variant.statistics?.sections || (variant.sections ? Object.keys(variant.sections).length : "N/A")}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Faculty:</span>
                        <span className="ml-2">
                          {variant.statistics?.faculty || (variant.faculty ? Object.keys(variant.faculty).length : "N/A")}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Total Classes:</span>
                        <span className="ml-2">
                          {variant.statistics?.total_classes || "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span>Course: {variant.course}</span>
                      <span>•</span>
                      <span>Year: {variant.year}</span>
                      <span>•</span>
                      <span>Semester: {variant.semester}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVariant(variant);
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                    >
                      View This
                    </button>
                    
                    {!variant.isApproved && variant._id !== approvedVariantId && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onApproveVariant(variant._id);
                        }}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main TimeTable Variant Viewer Component ---
const TimeTableVariantViewer = () => {
  const { courseId, year, semester } = useParams();
  const navigate = useNavigate();
  
  // State for variants and current selection
  const [variants, setVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState(null);
  const [approvedVariantId, setApprovedVariantId] = useState(null);
  
  // View states
  const [viewType, setViewType] = useState("section"); // "section" or "faculty"
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingVariantData, setLoadingVariantData] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  
  // Export states
  const [exportType, setExportType] = useState("pdf");
  const [allExportType, setAllExportType] = useState("pdf");
  
  // Subject colors for visualization
  const subjectColors = {
    MATH: "#FF9AA2",
    PHYSICS: "#FFB7B2",
    CHEMISTRY: "#FFDAC1",
    BIOLOGY: "#E2F0CB",
    ENGLISH: "#B5EAD7",
    HISTORY: "#C7CEEA",
    COMPUTER: "#F8B195",
    FREE: "#F0F0F0",
    DEFAULT: "#D8BFD8",
  };

  // Fetch all variants
  const fetchVariants = useCallback(async () => {
    if (!courseId || !year || !semester) return;
    
    setLoadingVariants(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/timetable/solutions?course=${courseId}&year=${year}&semester=${semester}`,
        { withCredentials: true }
      );
      
      console.log("Overall Response of variants:", response);
      
      if (response.data?.success) {
        let variantsData;
        
        // Handle different response structures
        if (Array.isArray(response.data.data)) {
          variantsData = response.data.data;
        } else if (response.data.data?.solutions) {
          variantsData = response.data.data.solutions;
        } else if (response.data.data) {
          variantsData = [response.data.data];
        } else if (response.data.solutions) {
          variantsData = response.data.solutions;
        } else {
          variantsData = [];
        }
        
        if (variantsData && variantsData.length > 0) {
          // Sort by rank
          const sortedVariants = [...variantsData].sort((a, b) => (a.rank || 0) - (b.rank || 0));
          setVariants(sortedVariants);
          
          // Find approved variant
          const approved = sortedVariants.find(v => v.isApproved);
          if (approved) {
            setApprovedVariantId(approved._id);
            // Load the approved variant's full data
            await fetchVariantFullData(approved._id);
          } else if (sortedVariants[0]) {
            // Load the first variant's full data
            await fetchVariantFullData(sortedVariants[0]._id);
          }
        } else {
          setError("No timetable variants found. Please generate a timetable first.");
        }
      } else {
        setError("Failed to fetch timetable variants.");
      }
    } catch (err) {
      console.error("Error fetching variants:", err);
      toast.error("Failed to load timetable variants");
      setError("Failed to load timetable data");
    } finally {
      setLoadingVariants(false);
    }
  }, [courseId, year, semester]);

  // Fetch full variant data by ID
  const fetchVariantFullData = useCallback(async (variantId) => {
    if (!variantId) return;
    
    setLoadingVariantData(true);
    try {
      console.log("Fetching variant by ID:", variantId);
      const response = await axios.get(
        `${API_BASE_URL}/timetable/solutions/${variantId}`,
        { withCredentials: true }
      );  

      console.log("Variant by ID Response:", response);
      
      if (response.data?.success) {
        const variantData = response.data.data;
        console.log("Setting current variant with full data:", variantData);
        
        // Update the variant in the variants list with full data
        setVariants(prev => prev.map(v => 
          v._id === variantId ? { ...v, ...variantData } : v
        ));
        
        // Set as current variant
        setCurrentVariant({ ...variantData, _id: variantId });
        setCurrentIndex(0); // Reset to first section/faculty
      } else {
        toast.error("Failed to load variant data");
      }
    } catch (err) { 
      console.error("Error fetching variant by ID:", err);
      toast.error("Failed to load selected timetable variant");
    } finally {
      setLoadingVariantData(false);
      setLoading(false);
    }
  }, []);

  // Handle variant selection
  const handleSelectVariant = useCallback(async (variant) => {
    console.log("Selecting variant:", variant);
    
    // If variant already has full data (sections and faculty), use it directly
    if (variant.sections && variant.faculty) {
      setCurrentVariant(variant);
      setCurrentIndex(0);
      setShowVariantsModal(false);
      toast.success(`Switched to Variant #${variant.rank || 1}`);
    } else {
      // Otherwise fetch full data
      await fetchVariantFullData(variant._id);
      setShowVariantsModal(false);
      toast.success(`Switched to Variant #${variant.rank || 1}`);
    }
  }, [fetchVariantFullData]);

  // Handle approve variant
  const handleApproveVariant = async (variantId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/timetable/solutions/approve`,
        {solutionId:variantId},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success("Timetable variant approved successfully!");
        setApprovedVariantId(variantId);
        
        // Update variants list
        setVariants(prev => prev.map(v => ({
          ...v,
          isApproved: v._id === variantId
        })));
        
        // Update current variant if needed
        if (currentVariant?._id === variantId) {
          setCurrentVariant(prev => ({ ...prev, isApproved: true }));
        }
      }
    } catch (err) {
      console.error("Error approving variant:", err);
      toast.error("Failed to approve variant");
    }
  };

  // Initial load
  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // Get current items based on view type
  const getCurrentItems = () => {
    if (!currentVariant) return [];
    
    if (viewType === "section") {
      console.log("Sections data:", currentVariant.sections);
      return Object.values(currentVariant.sections || {});
    } else {
      console.log("Faculty data:", currentVariant.faculty);
      return Object.values(currentVariant.faculty || {});
    }
  };

  const currentItems = getCurrentItems();
  const currentItem = currentItems[currentIndex] || {};

  // Color functions
  const getSubjectColor = (subject) => {
    if (!subject || subject === "FREE" || subject === "LUNCH BREAK") return subjectColors.FREE;
    
    const subjectKey = Object.keys(subjectColors).find((key) =>
      subject.toUpperCase().includes(key)
    );
    
    return subjectColors[subjectKey] || subjectColors.DEFAULT;
  };

  const hexToRgb = (hex) => {
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const getContrastYIQ = (hex) => {
    hex = hex.replace(/^#/, "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? [0, 0, 0] : [255, 255, 255];
  };

  // Export functions
  const exportCurrentToPDF = () => {
    if (!currentItem || !currentItem.periods) {
      toast.error("No data available to export");
      return;
    }
    
    try {
      const doc = new jsPDF();
      const title = viewType === "section" 
        ? `${currentItem.section_name || currentItem.section_id || 'Section'} - Semester ${semester}`
        : `${currentItem.faculty_name || 'Faculty'} (${currentItem.department || 'N/A'})`;
      
      // Title
      doc.setFontSize(16);
      doc.text(`Timetable: ${title}`, 14, 15);
      doc.setFontSize(12);
      doc.text(`Variant #${currentVariant?.rank || 1} • ${courseId} • Year ${year}`, 14, 22);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

      // Table Data
      const tableColumn = ["Time", ...days];
      const tableRows = [];

      Object.entries(currentItem.periods || {}).forEach(([periodNum, time]) => {
        const row = [time];
        days.forEach((day) => {
          const slot = currentItem.timetable?.[day]?.[periodNum] || "FREE";
          if (typeof slot === "string") {
            row.push(slot);
          } else {
            const details = [
              slot.subject,
              viewType === "section" ? slot.faculty_name : slot.section,
              slot.room,
              slot.type
            ].filter(Boolean).join('\n');
            row.push(details);
          }
        });
        tableRows.push(row);
      });

      // Table with colors
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 135, 245] },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index > 0) {
            const subjectText = data.cell.raw;
            const firstLine = subjectText.split("\n")[0];
            const bgColor = getSubjectColor(firstLine);
            data.cell.styles.fillColor = hexToRgb(bgColor);
            data.cell.styles.textColor = getContrastYIQ(bgColor);
          }
        },
      });

      const fileName = viewType === "section"
        ? `Timetable-${currentItem.section_id || 'section'}-Variant-${currentVariant?.rank || 1}.pdf`
        : `Timetable-${currentItem.faculty_id || 'faculty'}-Variant-${currentVariant?.rank || 1}.pdf`;
      
      doc.save(fileName);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const exportAllToPDF = () => {
    if (!currentVariant || !currentItems.length) {
      toast.error("No data available to export");
      return;
    }
    
    try {
      const doc = new jsPDF();
      const viewTitle = viewType === "section" ? "Sections" : "Faculty";
      
      currentItems.forEach((item, index) => {
        if (index > 0) doc.addPage();
        
        const title = viewType === "section"
          ? `${item.section_name || item.section_id || 'Section'} - Semester ${semester}`
          : `${item.faculty_name || 'Faculty'} (${item.department || 'N/A'})`;
        
        doc.setFontSize(16);
        doc.text(`Timetable: ${title}`, 14, 15);
        doc.setFontSize(12);
        doc.text(`Variant #${currentVariant?.rank || 1} • ${courseId} • Year ${year}`, 14, 22);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

        const tableColumn = ["Time", ...days];
        const tableRows = [];

        Object.entries(item.periods || {}).forEach(([periodNum, time]) => {
          const row = [time];
          days.forEach((day) => {
            const slot = item.timetable?.[day]?.[periodNum] || "FREE";
            if (typeof slot === "string") {
              row.push(slot);
            } else {
              const details = [
                slot.subject,
                viewType === "section" ? slot.faculty_name : slot.section,
                slot.room,
                slot.type
              ].filter(Boolean).join('\n');
              row.push(details);
            }
          });
          tableRows.push(row);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [66, 135, 245] },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index > 0) {
              const subjectText = data.cell.raw;
              const firstLine = subjectText.split("\n")[0];
              const bgColor = getSubjectColor(firstLine);
              data.cell.styles.fillColor = hexToRgb(bgColor);
              data.cell.styles.textColor = getContrastYIQ(bgColor);
            }
          },
        });
      });

      doc.save(`All-${viewTitle}-Variant-${currentVariant?.rank || 1}.pdf`);
      toast.success("All timetables exported successfully!");
    } catch (error) {
      console.error("Error exporting all PDFs:", error);
      toast.error("Failed to export all timetables");
    }
  };

  const handleSingleExport = () => {
    switch (exportType) {
      case "pdf":
        exportCurrentToPDF();
        break;
      default:
        toast.info("Only PDF export is available in this view");
    }
  };

  const handleAllExport = () => {
    switch (allExportType) {
      case "pdf":
        exportAllToPDF();
        break;
      default:
        toast.info("Only PDF export is available in this view");
    }
  };

  // Navigation
  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + currentItems.length) % currentItems.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % currentItems.length);
  };

  // Regenerate timetable
  const handleRegenerate = async () => {
    try {
      toast.info("Regenerating timetable...");
      const response = await axios.post(
        `${API_BASE_URL}/timetable/generate`,
        { course: courseId, year, semester },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success("Timetable regenerated successfully!");
        fetchVariants(); // Refresh variants
      }
    } catch (err) {
      console.error("Error regenerating timetable:", err);
      toast.error("Failed to regenerate timetable");
    }
  };

  const isLoading = loading || loadingVariants || loadingVariantData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timetable variants...</p>
        </div>
      </div>
    );
  }

  if (error || !currentVariant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Timetable Found
          </h2>
          <p className="text-gray-600 mb-4">{error || "No timetable data available"}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Timetable
            </button>
            <button
              onClick={() => navigate("/dashboard/organisation-data-taker")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Data Entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            {/* Left: Title and Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Timetable Viewer
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {courseId?.toUpperCase()}
                </span>
                <span>•</span>
                <span>Year {year}</span>
                <span>•</span>
                <span>Semester {semester}</span>
                <span>•</span>
                <span className="font-medium">
                  Variant #{currentVariant.rank || 1}
                  {currentVariant._id === approvedVariantId && (
                    <span className="ml-2 text-green-600">✓ Approved</span>
                  )}
                </span>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* View Toggle */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
              >
                <option value="section">Section View</option>
                <option value="faculty">Faculty View</option>
              </select>

              {/* Variant Selector */}
              <button
                onClick={() => setShowVariantsModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                disabled={loadingVariants}
              >
                {loadingVariants ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    Variants ({variants.length})
                  </>
                )}
              </button>

              {/* Approve Button */}
              {currentVariant._id !== approvedVariantId && (
                <button
                  onClick={() => handleApproveVariant(currentVariant._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <span>✅</span>
                  Approve This Variant
                </button>
              )}

              {/* Regenerate Button */}
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
              >
                <span>🔄</span>
                Regenerate
              </button>
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Export Current:</span>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleSingleExport}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Download
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Export All {viewType === "section" ? "Sections" : "Faculty"}:</span>
              <select
                value={allExportType}
                onChange={(e) => setAllExportType(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleAllExport}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Download All
              </button>
            </div>
          </div>

          {/* Pagination Navigation */}
          {currentItems.length > 1 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 rounded-lg">
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                ← Previous
              </button>

              <div className="text-center">
                <span className="font-semibold text-blue-600">
                  {currentIndex + 1} of {currentItems.length}
                </span>
                <p className="text-xs text-gray-500">
                  {viewType === "section" ? "Sections" : "Faculty Members"}
                </p>
              </div>

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                Next →
              </button>
            </div>
          )}

          {/* Timetable Grid */}
          {currentItem.periods ? (
            <div className="overflow-x-auto border rounded-lg">
              <div className="min-w-[800px] lg:min-w-full grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200">
                {/* Header Row */}
                <div className="bg-blue-600 p-3 font-semibold text-center text-white text-sm uppercase tracking-wide">
                  Time
                </div>
                {days.map((day) => (
                  <div
                    key={day}
                    className="bg-blue-600 p-3 font-semibold text-center text-white text-sm uppercase tracking-wide"
                  >
                    {day}
                  </div>
                ))}

                {/* Body Rows */}
                {Object.entries(currentItem.periods).map(([periodNum, time]) => (
                  <React.Fragment key={periodNum}>
                    {/* Time Column */}
                    <div className="p-3 border-b text-sm bg-gray-50 text-center font-medium text-gray-600">
                      {time}
                    </div>

                    {/* Days Columns */}
                    {days.map((day) => {
                      const slot = currentItem.timetable?.[day]?.[periodNum] || "FREE";
                      const backgroundColor = getSubjectColor(
                        typeof slot === "string" ? slot : slot.subject
                      );

                      return (
                        <div
                          key={day + periodNum}
                          className="p-3 border-b text-center text-sm min-h-[80px] flex flex-col justify-center"
                          style={{ backgroundColor }}
                        >
                          {typeof slot === "string" ? (
                            <span className="text-gray-600 font-medium">
                              {slot === "LUNCH BREAK" ? "LUNCH" : slot}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <div className="font-bold text-gray-900">
                                {slot.subject}
                              </div>
                              <div className="text-xs text-gray-700">
                                {viewType === "section" ? slot.faculty_name : slot.section}
                              </div>
                              <div className="text-xs text-gray-500">
                                {slot.room} • {slot.type}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              No timetable data available for this variant
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300"></div>
                  <span>Scheduled Class</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300"></div>
                  <span>Free Slot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300"></div>
                  <span>Lunch Break</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">Fitness Score:</span>
                <span className="ml-2 text-blue-600 font-bold">
                  {currentVariant.fitness?.toFixed(2) || currentVariant.statistics?.fitness_score?.toFixed(2) || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantsModal && (
        <VariantRankModal
          variants={variants}
          onClose={() => setShowVariantsModal(false)}
          onSelectVariant={handleSelectVariant}
          onApproveVariant={handleApproveVariant}
          course={courseId}
          year={year}
          semester={semester}
          approvedVariantId={approvedVariantId}
        />
      )}
    </div>
  );
};

export default TimeTableVariantViewer;