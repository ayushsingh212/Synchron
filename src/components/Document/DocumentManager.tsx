import React, { useState, useEffect, useCallback } from "react";
import {
  getAllDocuments,
  generateUploadUrls,
  saveUploadedDocuments,
  extractAllDocumentsText,
} from "../../api/ragApi";
import DocumentList from "./DocumentList";
import FileUploader from "./FileUploader";
import {
  FileText,
  Upload,
  RefreshCw,
  AlertCircle,
  Folder,
  Database,
  BarChart3,
} from "lucide-react";
import { API_BASE_URL } from "../../config";
import axios from "axios";

interface Props {
  organisationId: string;
  folderName: string;
  folderId: string;
}

interface Document {
  _id?: string;
  fileName: string;
  key: string;
  viewUrl: string;
  extractedText?: string;
  vectorId?: string;
  createdAt?: string;
}

export default function DocumentManager({ organisationId, folderName, folderId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtractingAll, setIsExtractingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    extracted: 0,
    vectorized: 0
  });

  const loadDocuments = useCallback(async () => {
    if (!folderName) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/context/docs?folderName=${folderName}`, {
        withCredentials: true
      });
      const docs = response.data.data || [];
      setDocuments(docs);

      // Calculate statistics
      const extracted = docs.filter(doc => doc.extractedText).length;
      const vectorized = docs.filter(doc => doc.vectorId).length;
      setStats({
        total: docs.length,
        extracted,
        vectorized
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load documents.");
      console.error("Error loading documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organisationId, folderName]);

  const handleUploadComplete = async (uploadedDocuments: Array<{
    fileName: string;
    key: string;
    viewUrl: string;
  }>) => {
    try {

      await axios.post(`${API_BASE_URL}/context/save-docs`, {
        folderName,
        documents: uploadedDocuments
      },
        {
          withCredentials: true
        }
      )
      await loadDocuments();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save document metadata.");
      console.error("Error saving documents:", err);
    }
  };

  const handleExtractAll = async () => {
    if (documents.length === 0) return;

    setIsExtractingAll(true);
    setError(null);
    try {
      // await extractAllDocumentsText(organisationId, folderName);
        await axios.post(`${API_BASE_URL}/context/extract-all`,{
          folderName
        },{
          withCredentials:true
        })
      await loadDocuments();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to extract text from documents.");
      console.error("Extraction error:", err);
    } finally {
      setIsExtractingAll(false);
    }
  };

  const handleRefresh = () => {
    loadDocuments();
  };

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Documents</h2>
              <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                <span>Folder:</span>
                <span className="font-semibold bg-white/20 px-2 py-1 rounded">{folderName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-blue-100 hover:text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              aria-label="Refresh documents"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {documents.length > 0 && (
              <button
                onClick={handleExtractAll}
                disabled={isExtractingAll}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {isExtractingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>{isExtractingAll ? "Extracting..." : "Extract All"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Text Extracted</p>
              <p className="text-xl font-bold text-gray-900">{stats.extracted}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vectorized</p>
              <p className="text-xl font-bold text-gray-900">{stats.vectorized}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* File Uploader */}
        <FileUploader
          organisationId={organisationId}
          folderName={folderName}
          onUploaded={handleUploadComplete}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium mb-1">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              &times;
            </button>
          </div>
        )}

        {/* Documents List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Documents in this folder
            </h3>
            <div className="text-sm text-gray-500">
              Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
            </div>
          </div>

          <DocumentList
            documents={documents}
            organisationId={organisationId}
            folderName={folderName}
            onRefresh={loadDocuments}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {documents.length === 0
              ? "Upload PDF files to start processing them for RAG"
              : "Click on a document to preview, extract text, or delete"}
          </p>
          <div className="text-xs text-gray-400">
            Folder ID: <span className="font-mono">{folderId.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
}