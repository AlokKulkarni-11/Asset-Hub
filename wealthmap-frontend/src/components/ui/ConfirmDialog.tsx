import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 border border-gray-200">
        <button 
          onClick={onCancel} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-full shrink-0 ${
            isDestructive 
              ? 'bg-red-50 text-red-600' 
              : 'bg-blue-50 text-blue-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">{title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end mt-6">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-md ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
