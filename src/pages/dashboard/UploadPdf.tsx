import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Loader2,
  UploadCloud,
  Check,
  FileText,
  XCircle,
  Copy,
  Download,
  ArrowRightCircle,
} from "lucide-react";
import { API_BASE_URL, MODEL_BASE_URL, useAppState } from "../../config";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const UploadPdf = () => {
  const { courseId, year, semester } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const { setHasOrganisationData } = useAppState();

  // Debounce states
  const [debounceUpload, setDebounceUpload] = useState(false);
  const [debounceSave, setDebounceSave] = useState(false);

  const fileInputRef = useRef();

  // -----------------------------
  // File Selection
  // -----------------------------
  const handleFileChange = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    if (picked.type !== "application/pdf") {
      toast.error("Please upload a PDF file only.");
      return;
    }

    setFile(picked);
    setResult(null);
  };

  // -----------------------------
  // Drag & Drop
  // -----------------------------
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const picked = e.dataTransfer.files?.[0];
    if (!picked) return;

    if (picked.type !== "application/pdf") {
      toast.error("Please upload a PDF file only.");
      return;
    }

    setFile(picked);
    setResult(null);
  };

  // -------------------------------------------------
  // UPLOAD + DEBOUNCING (1.5 sec lock)
  // -------------------------------------------------
  const handleUpload = async (e) => {
    e.preventDefault();

    if (debounceUpload) {
      toast.warn("Please wait… Upload is already happening.");
      return;
    }

    setDebounceUpload(true);
    setTimeout(() => setDebounceUpload(false), 1500);

    if (!file) {
      toast.warn("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setResult(null);

      const res = await axios.post(
        `${MODEL_BASE_URL}/parse-timetable`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
          timeout: 120000,
        }
      );

      const parsed = res?.data?.data;

      if (!parsed) {
        toast.error("Parsing returned no data.");
        return;
      }

      setResult(parsed);
      toast.success("PDF parsed successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to parse PDF.");
    } finally {
      setUploading(false);
    }
  };

  
  const handleSave = async () => {
    if (debounceSave) {
      toast.warn("Please wait… Saving in progress.");
      return;
    }

    setDebounceSave(true);
    setTimeout(() => setDebounceSave(false), 1500);

    if (!result) {
      toast.error("Upload a PDF first.");
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/timetable/saveData?course=${courseId}&year=${year}&semester=${semester}`,
        result,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 60000,
        }
      );

      setHasOrganisationData(true);
      toast.success("Saved successfully!");

      setTimeout(() => {
        navigate(
          `/dashboard/organisation-data-taker/${courseId}/${year}/${semester}/data`
        );
      }, 800);
    } catch (error) {
      console.error("Saving error:", error);
      toast.error("Failed to save data.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success("Copied JSON!");
    } catch {
      toast.error("Copy failed.");
    }
  };


  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${file?.name?.replace(/\.pdf$/i, "") || "timetable"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

 
  const handleReset = () => {
    setFile(null);
    setResult(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-3xl p-8 border border-gray-200">

        {/* HEADER */}
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold">
            Academic Data for Course:{" "}
            <span className="text-yellow-300">{courseId}</span>
          </h2>
          <p className="text-sm">Year: {year}</p>
          <p className="text-sm">Semester: {semester}</p>
        </div>

        {/* Upload Box */}
        <form onSubmit={handleUpload} className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`p-6 border-2 border-dashed rounded-xl transition cursor-pointer ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-3">
              <UploadCloud
                className={`w-10 h-10 ${
                  isDragging ? "text-blue-600 animate-bounce" : "text-blue-500"
                }`}
              />
              <div>
                <p className="font-medium text-gray-800">
                  {isDragging
                    ? "Drop PDF here…"
                    : file
                    ? file.name
                    : "Click to upload or drag your PDF"}
                </p>
                <p className="text-xs text-gray-500">
                  Only PDF files. Parsing may take a few seconds.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

        
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
              {uploading ? "Processing…" : "Upload & Extract"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50"
            >
              <XCircle className="w-5 h-5" />
              Reset
            </button>
          </div>
        </form>

        {/* Parsed Result */}
        {result && (
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold">Parsed Data Preview</h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4 inline" /> Copy
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 inline" /> Download
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    <Check className="w-4 h-4 inline" />
                  )}
                  {saving ? "Saving…" : "Save & Fill"}
                </button>
              </div>
            </div>

            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-80">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Empty state */}
        {!result && (
          <p className="mt-6 text-center text-sm text-gray-500">
            After upload, parsed data will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadPdf;
