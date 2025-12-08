import React, { useState } from "react";
import {
  extractTextForDocument,
  deleteDocument,
} from "../../api/ragApi";
import {
  FileText,
  Trash2,
  Eye,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileSearch
} from "lucide-react";

interface Props {
  documents: any[];
  organisationId: string;
  folderName: string;
  onRefresh: () => void;
}

export default function DocumentList({ documents, organisationId, folderName, onRefresh }: Props) {
  const [extractingDoc, setExtractingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const handleExtract = async (key: string) => {
    setExtractingDoc(key);
    try {
      await extractTextForDocument(organisationId, folderName, key);
      onRefresh();
    } catch (err: any) {
      console.error("Extraction error:", err);
    } finally {
      setExtractingDoc(null);
    }
  };

  const handleDelete = async (key: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingDoc(key);
    try {
      await deleteDocument(organisationId, folderName, key);
      onRefresh();
    } catch (err: any) {
      console.error("Delete error:", err);
    } finally {
      setDeletingDoc(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedDoc(expandedDoc === key ? null : key);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-blue-100 rounded-xl bg-blue-50/50">
        <FileSearch className="w-16 h-16 text-blue-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Documents Yet</h3>
        <p className="text-gray-500 text-sm">
          Upload PDF files to this folder to start processing them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.key || doc._id}
          className="border border-blue-100 rounded-xl overflow-hidden bg-white hover:border-blue-200 transition-all duration-200"
        >
          {/* Document Header */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </h4>
                    {doc.extractedText && (
                      <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>Text Extracted</span>
                      </div>
                    )}
                    {doc.vectorId && (
                      <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        <Database className="w-3 h-3" />
                        <span>Vectorized</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="text-xs">{formatDate(doc.createdAt)}</span>
                    <span className="text-xs">•</span>
                    <a
                      href={doc.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </a>
                    <a
                      href={doc.viewUrl}
                      download
                      className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors duration-200"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {!doc.extractedText ? (
                  <button
                    onClick={() => handleExtract(doc.key)}
                    disabled={extractingDoc === doc.key}
                    className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {extractingDoc === doc.key ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileSearch className="w-3 h-3" />
                    )}
                    <span>{extractingDoc === doc.key ? "Extracting..." : "Extract"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => toggleExpand(doc.key)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{expandedDoc === doc.key ? "Collapse" : "View Text"}</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(doc.key, doc.fileName)}
                  disabled={deletingDoc === doc.key}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50"
                  aria-label={`Delete ${doc.fileName}`}
                >
                  {deletingDoc === doc.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Extracted Text Section */}
          {doc.extractedText && expandedDoc === doc.key && (
            <div className="border-t border-blue-100 bg-blue-50/50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-700">Extracted Text</h5>
                  <button
                    onClick={() => copyToClipboard(doc.extractedText)}
                    className="px-3 py-1 bg-white border border-blue-200 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2"
                  >
                    {copiedText === doc.extractedText ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedText === doc.extractedText ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <div className="bg-white rounded-lg border border-blue-100 p-4">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto font-sans">
                    {doc.extractedText}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Truncated Text Preview */}
          {doc.extractedText && expandedDoc !== doc.key && (
            <div className="border-t border-blue-100 p-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {truncateText(doc.extractedText, 150)}
                </p>
                <button
                  onClick={() => toggleExpand(doc.key)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center gap-1"
                >
                  <span>Show more</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}