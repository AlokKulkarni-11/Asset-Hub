import React, { useState } from 'react';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { documentsApi } from '../../api/documents.api';

interface DocumentUploadAiParserProps {
  assetType?: string;
  onExtracted?: (data: any) => void;
  className?: string;
}

export const DocumentUploadAiParser: React.FC<DocumentUploadAiParserProps> = ({
  assetType,
  onExtracted,
  className = ''
}) => {
  const [parsing, setParsing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      await parseFile(selected);
    }
  };

  const parseFile = async (fileToParse: File) => {
    try {
      setParsing(true);
      setStatusMessage('Analyzing document with Gemini AI...');
      setIsSuccess(false);

      const res = await documentsApi.parseOnly(fileToParse, assetType);
      let parsed: any = null;

      if (res && typeof res === 'object') {
        if (res.extractedData) {
          try {
            parsed = typeof res.extractedData === 'string' ? JSON.parse(res.extractedData) : res.extractedData;
          } catch {
            parsed = res;
          }
        } else {
          parsed = res;
        }
      }

      if (parsed && Object.keys(parsed).length > 0) {
        setIsSuccess(true);
        setStatusMessage('Document parsed successfully! Form fields pre-filled.');
        if (onExtracted) {
          onExtracted(parsed);
        }
      } else {
        setStatusMessage('Document processed, please verify details below.');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Could not extract details automatically. Please enter manually.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className={`p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center ${className}`}>
      <input
        type="file"
        id="ai-doc-upload"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
        disabled={parsing}
      />
      <label
        htmlFor="ai-doc-upload"
        className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
      >
        {parsing ? (
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
        ) : isSuccess ? (
          <Check className="w-7 h-7 text-emerald-600" />
        ) : (
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
        )}

        <div className="text-xs font-semibold text-slate-700">
          {parsing ? 'Parsing Document with Gemini Vision...' : 'Upload PDF / Receipt to Auto-Fill via AI'}
        </div>
        <p className="text-[11px] text-slate-500">
          Supports FD receipts, Gold invoices, Mutual Fund/Stock statements & Loan sanction letters (PDF, PNG, JPG)
        </p>
      </label>

      {statusMessage && (
        <div className={`mt-2.5 text-xs font-medium ${isSuccess ? 'text-emerald-600' : 'text-slate-600'}`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};
