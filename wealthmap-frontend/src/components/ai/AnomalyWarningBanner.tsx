import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AnomalyCheckResponse } from '../../api/ai.api';

interface AnomalyWarningBannerProps {
  anomaly: AnomalyCheckResponse | null;
  onDismiss?: () => void;
  onApplyCorrection?: (correction: string) => void;
}

export const AnomalyWarningBanner: React.FC<AnomalyWarningBannerProps> = ({
  anomaly,
  onDismiss,
  onApplyCorrection
}) => {
  if (!anomaly || !anomaly.isAnomaly) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start justify-between">
      <div className="flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold text-amber-900">Possible Data Entry Issue</h4>
          <p className="text-xs text-amber-700 mt-0.5">{anomaly.warningMessage}</p>
          {anomaly.suggestedCorrection && onApplyCorrection && (
            <button
              type="button"
              onClick={() => onApplyCorrection(anomaly.suggestedCorrection!)}
              className="mt-1.5 text-xs font-semibold text-amber-800 underline hover:text-amber-950 block"
            >
              Suggested: {anomaly.suggestedCorrection} (Click to apply)
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-700 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
