import React, { useState } from 'react';
import { X, FileSpreadsheet, Printer, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AssetResponse } from '../../api/assets.api';
import { LiabilityResponse } from '../../api/liabilities.api';
import { exportToCsv, exportToPdf, formatCurrencyINR } from '../../utils/exportUtils';
import { useAuthStore } from '../../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assets?: AssetResponse[];
  liabilities?: LiabilityResponse[];
  analytics?: any;
  familyName?: string;
}

export default function ExportModal({
  isOpen,
  onClose,
  assets = [],
  liabilities = [],
  analytics,
  familyName,
}: Props) {
  const user = useAuthStore((state) => state.user);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleExportCsv = () => {
    exportToCsv({
      assets,
      liabilities,
      analytics,
      userName: user?.name || user?.email || 'Portfolio Owner',
      familyName,
    });
    setExportedFormat('CSV');
    setTimeout(() => setExportedFormat(null), 3000);
  };

  const handleExportPdf = () => {
    exportToPdf({
      assets,
      liabilities,
      analytics,
      userName: user?.name || user?.email || 'Portfolio Owner',
      familyName,
    });
    setExportedFormat('PDF');
    setTimeout(() => setExportedFormat(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200 border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Wealth Report</h2>
            <p className="text-xs text-gray-600">Download your portfolio data for tax filing, records, or printing</p>
          </div>
        </div>

        {/* Portfolio Snapshot Preview */}
        <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[11px] text-gray-500 font-medium uppercase">Net Worth</div>
              <div className="text-base font-bold text-sky-600">{formatCurrencyINR(netWorth)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 font-medium uppercase">Total Assets</div>
              <div className="text-base font-bold text-gray-900">{formatCurrencyINR(totalAssets)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 font-medium uppercase">Liabilities</div>
              <div className="text-base font-bold text-red-600">{formatCurrencyINR(totalLiabilities)}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-100 flex items-center justify-between text-xs text-gray-600">
            <span>Holdings: <strong>{assets.length} assets</strong></span>
            <span>Debts: <strong>{liabilities.length} liabilities</strong></span>
          </div>
        </div>

        {exportedFormat && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{exportedFormat} report generated successfully! Check your downloads / print dialog.</span>
          </div>
        )}

        {/* Format Selection Cards */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleExportCsv}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Export as CSV (Excel / Sheets)</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Full dataset with original foreign values, converted INR amounts, gains, and nominees.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              Download .CSV
            </span>
          </button>

          <button
            onClick={handleExportPdf}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Print / Save as PDF Statement</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Formatted A4 executive portfolio statement ready to print or save to PDF.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              Open PDF
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Client-side secure export (zero data sent to third parties)</span>
          </div>
          <button
            onClick={onClose}
            className="font-medium text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
