import axios from 'axios';

const API_BASE = '/api/rag';

const api = axios.create({
  baseURL: `${API_BASE}/context`,
  withCredentials:true,

});



// Folder operations
export const getFolders = async (organisationId: string) => {
  return api.get('/folders');
};

export const createFolder = async (organisationId: string, folderName: string) => {
  return api.post('/createFolder', 
    { folderName }
  );
};

export const deleteFolder = async (organisationId: string, folderName: string) => {
  return api.delete('/deleteFolder', {
    data: { folderName }
  });
};


export const generateUploadUrls = async (files: Array<{fileName: string, fileType: string}>, folderName: string) => {
  return api.post('/upload-urls', { files, folderName });
};

export const saveUploadedDocuments = async (organisationId: string, folderName: string, documents: Array<{fileName: string, key: string, viewUrl: string}>) => {
  return api.post('/save-docs', 
    { organisationId, folderName, documents }
  );
};

export const getAllDocuments = async (organisationId: string, folderName: string) => {
  return api.get('/docs', {
    params: { organisationId, folderName },
  });
};

export const deleteDocument = async (organisationId: string, folderName: string, key: string) => {
  return api.post('/delete-doc', 
    { organisationId, folderName, key }
  );
};

export const extractTextForDocument = async (organisationId: string, folderName: string, key: string) => {
  return api.post('/extract-one', 
    { organisationId, folderName, key }
  );
};

export const extractAllDocumentsText = async (organisationId: string, folderName: string) => {
  return api.post('/extract-all', 
    { organisationId, folderName }
  );
};

// For backward compatibility
export const getDocuments = getAllDocuments;
export const saveDocuments = saveUploadedDocuments;
export const extractOne = extractTextForDocument;
export const extractAll = extractAllDocumentsText;