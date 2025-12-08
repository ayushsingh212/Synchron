import React, { useState, useEffect } from "react";
import FolderList from "../../components/Document/FolderList";
import DocumentManager from "../../components/Document/DocumentManager";
import { LayoutDashboard, Shield, Database } from "lucide-react";

export default function DocumentManagement() {
  const [organisationId, setOrganisationId] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);

  // In production, this would come from auth context
  useEffect(() => {
    // Simulate getting organisation ID from auth
    const storedOrgId = localStorage.getItem("organisationId") || "ORG_" + Date.now();
    setOrganisationId(storedOrgId);
  }, []);

  const handleSelectFolder = (folderId: string, folderName: string) => {
    setSelectedFolder({ id: folderId, name: folderName });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RAG Document Management</h1>
                <p className="text-sm text-gray-500">Upload, organize, and extract text from your documents</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Organisation</span>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {organisationId.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">RAG Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1">
            <FolderList
              organisationId={organisationId}
              onSelect={handleSelectFolder}
              selectedFolder={selectedFolder?.id}
            />
          </div>

          {/* Main Content Area - Documents */}
          <div className="lg:col-span-3">
            {selectedFolder ? (
              <DocumentManager
                organisationId={organisationId}
                folderName={selectedFolder.name}
                folderId={selectedFolder.id}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <LayoutDashboard className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to RAG Document Management</h3>
                  <p className="text-gray-600 mb-6">
                    Select a folder from the sidebar to manage your documents.
                    Create a new folder to start organizing your PDFs for RAG processing.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">1</div>
                      <div>Create Folder</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">2</div>
                      <div>Upload PDFs</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">3</div>
                      <div>Extract Text</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Organisation ID</p>
                <p className="text-lg font-mono font-bold text-gray-900 truncate">{organisationId}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Folder</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedFolder ? selectedFolder.name : "None selected"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">System Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-lg font-bold text-gray-900">All Systems Operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}