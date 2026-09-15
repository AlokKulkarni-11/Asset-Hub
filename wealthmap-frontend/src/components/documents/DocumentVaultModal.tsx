import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Trash2, ExternalLink, HardDrive, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { documentsApi, AssetDocumentResponse, GoogleStatusResponse } from '../../api/documents.api';

interface DocumentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId?: number;
  assetName?: string;
  assetType?: string;
  liabilityId?: number;
  liabilityName?: string;
}

export const DocumentVaultModal: React.FC<DocumentVaultModalProps> = ({
  isOpen,
  onClose,
  assetId,
  assetName,
  assetType,
  liabilityId,
  liabilityName
}) => {
  const [documents, setDocuments] = useState<AssetDocumentResponse[]>([]);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocsAndStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const docsPromise = assetId 
        ? documentsApi.getAssetDocuments(assetId) 
        : (liabilityId ? documentsApi.getLiabilityDocuments(liabilityId) : documentsApi.getUserDocuments());

      const [statusRes, docsRes] = await Promise.all([
        documentsApi.getGoogleStatus(),
        docsPromise
      ]);
      setGoogleStatus(statusRes);
      setDocuments(docsRes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocsAndStatus();
    }
  }, [isOpen, assetId, liabilityId]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setUploading(true);
      setError(null);
      const newDoc = await documentsApi.uploadDocument(file, assetId, assetType, liabilityId);
      setDocuments([newDoc, ...documents]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document to Google Drive');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document from Google Drive?')) return;
    try {
      await documentsApi.deleteDocument(docId);
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {assetName ? `Document Vault — ${assetName}` : (liabilityName ? `Document Vault — ${liabilityName}` : 'Document Vault (Google Drive)')}
              </h2>
              <p className="text-xs text-slate-500">
                Securely store statements, sanction letters, invoices & receipts in your personal Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Google Drive Status Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>
                Google Drive Storage:{' '}
                {googleStatus?.connected ? (
                  <strong className="text-emerald-700">Connected ({googleStatus.googleEmail})</strong>
                ) : (
                  <span className="text-slate-500">Not linked (using local mock vault)</span>
                )}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Folder: Asset Hub Documents</span>
          </div>

          {/* Upload Button Zone */}
          <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
            <div>
              <h4 className="text-xs font-bold text-indigo-950">Add New Document</h4>
              <p className="text-[11px] text-indigo-700 mt-0.5">Upload PDF, receipt image, loan sanction letter, or statement for AI indexing</p>
            </div>
            <div>
              <input
                type="file"
                id="vault-file-input"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="vault-file-input"
                className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attached Documents ({documents.length})
            </h4>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No documents uploaded yet for this {liabilityId ? 'liability' : 'asset'}.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors shadow-sm"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{doc.fileName}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Recent'}</span>
                        {doc.extractedData && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold flex items-center">
                              <Sparkles className="w-3 h-3 mr-0.5" /> AI Indexed
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {doc.googleDriveWebViewLink && (
                      <a
                        href={doc.googleDriveWebViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View in Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
