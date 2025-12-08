import React, { useEffect, useState, useCallback } from "react";
import {
  getFolders,
  createFolder,
  deleteFolder,
} from "../../api/ragApi";
import { Folder, Plus, Trash2, AlertCircle, Loader2, FileText, Calendar, Search } from "lucide-react";
import { API_BASE_URL } from "../../config";
import axios from "axios";
import { toast } from "react-toastify";

interface Props {
  organisationId: string;
  onSelect: (folderId: string, folderName: string) => void;
  selectedFolder?: string;
}

interface FolderItem {
  _id: string;
  folderName: string;
  uploadedDocuments: number;
  createdAt: string;
  updatedAt: string;
}

export default function FolderList({
  organisationId,
  onSelect,
  selectedFolder,
}: Props) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<FolderItem[]>([]);
  const [newFolder, setNewFolder] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/context/folders`,{
        withCredentials:true
      })
      
      if (response.data.data && Array.isArray(response.data.data)) {
        const processedFolders = response.data.data.map((folder: any) => ({
          _id: folder._id,
          folderName: folder.folderName,
          uploadedDocuments: folder.uploadedDocuments?.length || 0,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        }));
        setFolders(processedFolders);
        setFilteredFolders(processedFolders);
      } else {
        setFolders([]);
        setFilteredFolders([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load folders. Please try again.");
      console.error("Error loading folders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organisationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolder.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      // await createFolder(organisationId, newFolder.trim());
      await axios.post(`${API_BASE_URL}/context/createFolder`,{
  folderName:newFolder.trim()
      },{
        withCredentials:true
      })
      toast.success("Folder created successfully")
      setNewFolder("");
      await loadFolders();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create folder. Please try again.");
      console.error("Error creating folder:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (folder: FolderItem) => {
    if (!confirm(`Are you sure you want to delete "${folder.folderName}" and all its documents? This action cannot be undone.`)) return;

    setDeletingId(folder._id);
    
    try {
  await axios.delete(`${API_BASE_URL}/context/deleteFolder/${folder.folderName}`,{
        withCredentials:true
      });
            await loadFolders();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete folder. Please try again.");
      console.error("Error deleting folder:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredFolders(folders);
      return;
    }
    const filtered = folders.filter(folder =>
      folder.folderName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredFolders(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [folders, searchQuery]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 h-fit">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Folder className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Document Folders</h2>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          Organize your documents into folders
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Create Folder Form */}
        <form onSubmit={handleCreate} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Create New Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter folder name"
              disabled={isCreating}
              aria-label="New folder name"
            />
            <button
              type="submit"
              disabled={!newFolder.trim() || isCreating}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isCreating ? "Creating..." : "Create"}</span>
            </button>
          </div>
        </form>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search folders..."
            className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Folders List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">
              Your Folders ({filteredFolders.length})
            </h3>
            {isLoading && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-gray-500 text-sm mt-2">Loading folders...</p>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-blue-100 rounded-lg bg-blue-50/50">
                <Folder className="w-12 h-12 text-blue-300 mx-auto" />
                <p className="text-gray-500 text-sm mt-2">
                  {searchQuery ? "No matching folders" : "No folders yet"}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {searchQuery ? "Try a different search" : "Create your first folder above"}
                </p>
              </div>
            ) : (
              filteredFolders.map((folder) => (
                <div
                  key={folder._id}
                  className={`group relative p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedFolder === folder._id
                      ? "bg-blue-50 border border-blue-200 shadow-sm"
                      : "hover:bg-blue-50/50 border border-transparent hover:border-blue-100"
                  }`}
                  onClick={() => onSelect(folder._id, folder.folderName)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <Folder
                          className={`w-5 h-5 flex-shrink-0 ${
                            selectedFolder === folder._id
                              ? "text-blue-600"
                              : "text-blue-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-semibold truncate ${
                              selectedFolder === folder._id
                                ? "text-blue-700"
                                : "text-gray-700"
                            }`}
                            title={folder.folderName}
                          >
                            {folder.folderName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FileText className="w-3 h-3" />
                              <span>{folder.uploadedDocuments} doc{folder.uploadedDocuments !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(folder.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(folder);
                      }}
                      disabled={deletingId === folder._id}
                      className="ml-2 p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Delete folder ${folder.folderName}`}
                    >
                      {deletingId === folder._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
        <p className="text-xs text-gray-500">
          {folders.length === 0 
            ? "Create folders to organize your documents for RAG processing." 
            : "Click on a folder to manage its documents."}
        </p>
      </div>
    </div>
  );
}