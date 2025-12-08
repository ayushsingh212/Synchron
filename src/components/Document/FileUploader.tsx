import React, { useState, useCallback } from "react";
import { generateUploadUrls } from "../../api/ragApi";
import axios from "axios";
import {
  Upload,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  CloudUpload
} from "lucide-react";
import { API_BASE_URL } from "../../config";

interface Props {
  organisationId: string;
  folderName: string;
  onUploaded: (documents: Array<{fileName: string, key: string, viewUrl: string}>) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function FileUploader({ organisationId, folderName, onUploaded }: Props) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const upload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Get presigned URLs
      const filesData = uploadFiles.map(uf => ({
        fileName: uf.file.name,
        fileType: uf.file.type
      }));

  
   const urlsResponse = await axios.post(`${API_BASE_URL}/context/upload-urls`,{
  files: filesData
},{
  withCredentials: true
});

      const presignedUrls = urlsResponse.data.data;

      const resultMeta: Array<{fileName: string, key: string, viewUrl: string}> = [];

      // Upload each file
      for (let i = 0; i < uploadFiles.length; i++) {
        const uploadFile = uploadFiles[i];
        const { uploadUrl, key, viewUrl } = presignedUrls[i];

        setUploadFiles(prev => prev.map((uf, idx) =>
          idx === i ? { ...uf, status: 'uploading' } : uf
        ));

        try {
          await axios.put(uploadUrl, uploadFile.file, {
            onUploadProgress: (e) => {
              const progress = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
              setUploadFiles(prev => prev.map((uf, idx) =>
                idx === i ? { ...uf, progress } : uf
              ));
            }
          });

          setUploadFiles(prev => prev.map((uf, idx) =>
            idx === i ? { ...uf, status: 'completed', progress: 100 } : uf
          ));

          resultMeta.push({
            fileName: uploadFile.file.name,
            key,
            viewUrl
          });
        } catch (error) {
          setUploadFiles(prev => prev.map((uf, idx) =>
            idx === i ? {
              ...uf,
              status: 'error',
              error: 'Upload failed'
            } : uf
          ));
          throw error;
        }
      }

      // Call parent callback with uploaded documents
      onUploaded(resultMeta);

      // Clear successful uploads after 2 seconds
      setTimeout(() => {
        setUploadFiles([]);
      }, 2000);

    } catch (err: any) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
  const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading');
  const completedFiles = uploadFiles.filter(f => f.status === 'completed');
  const errorFiles = uploadFiles.filter(f => f.status === 'error');

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-blue-300 hover:border-blue-400 bg-blue-50/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
            <CloudUpload className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload PDF Documents</h3>
          <p className="text-gray-500 text-sm mb-6">
            Drag and drop your PDF files here, or click to browse
          </p>
          
          <label className="cursor-pointer">
            <div className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Browse Files
            </div>
            <input
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </label>
          
          <p className="text-xs text-gray-400 mt-4">
            Only PDF files are supported. Max file size: 10MB per file.
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Selected Files ({uploadFiles.length})
            </h4>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {pendingFiles.length} pending • {uploadingFiles.length} uploading • {completedFiles.length} completed
              </span>
              <button
                onClick={() => setUploadFiles([])}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={isUploading}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadFiles.map((uploadFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {uploadFile.file.name}
                      </span>
                      {uploadFile.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatFileSize(uploadFile.file.size)}</span>
                      {uploadFile.error && (
                        <span className="text-red-500">{uploadFile.error}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  {uploadFile.status === 'uploading' && (
                    <div className="w-32">
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {uploadFile.progress}%
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploadFile.status === 'uploading'}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50"
                    aria-label={`Remove ${uploadFile.file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="pt-4 border-t border-blue-100">
            <button
              onClick={upload}
              disabled={isUploading || uploadFiles.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}