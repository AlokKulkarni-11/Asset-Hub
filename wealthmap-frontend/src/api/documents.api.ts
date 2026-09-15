import api from './axios';

export interface AssetDocumentResponse {
  id: number;
  assetId?: number;
  assetName?: string;
  liabilityId?: number;
  liabilityName?: string;
  fileName: string;
  fileType?: string;
  mimeType?: string;
  fileSize: number;
  googleDriveFileId?: string;
  driveFileId?: string;
  googleDriveWebViewLink?: string;
  driveViewUrl?: string;
  driveDownloadUrl?: string;
  documentType?: string;
  extractedData?: string;
  extractedFields?: Record<string, any>;
  createdAt?: string;
  uploadedAt?: string;
}

export interface GoogleStatusResponse {
  connected: boolean;
  googleEmail?: string;
  folderId?: string;
}

export const documentsApi = {
  uploadDocument: async (file: File, assetId?: number, assetType?: string, liabilityId?: number): Promise<AssetDocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (assetId) formData.append('assetId', assetId.toString());
    if (liabilityId) formData.append('liabilityId', liabilityId.toString());
    if (assetType) formData.append('assetType', assetType);

    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  parseOnly: async (file: File, assetType?: string): Promise<Record<string, any>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (assetType) formData.append('assetType', assetType);

    const res = await api.post('/documents/parse-only', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getAssetDocuments: async (assetId: number): Promise<AssetDocumentResponse[]> => {
    const res = await api.get(`/documents/asset/${assetId}`);
    return res.data;
  },
  getLiabilityDocuments: async (liabilityId: number): Promise<AssetDocumentResponse[]> => {
    const res = await api.get(`/documents/liability/${liabilityId}`);
    return res.data;
  },
  getUserDocuments: async (): Promise<AssetDocumentResponse[]> => {
    const res = await api.get('/documents/user');
    return res.data;
  },
  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
  getGoogleStatus: async (): Promise<GoogleStatusResponse> => {
    const res = await api.get('/auth/google/status');
    return res.data;
  },
  linkGoogle: async (code: string, redirectUri: string) => {
    const res = await api.post('/auth/google/link', { code, authCode: code, redirectUri });
    return res.data;
  },
  loginWithGoogle: async (code: string, redirectUri: string) => {
    const res = await api.post('/auth/google', { code, authCode: code, redirectUri });
    return res.data;
  }
};
