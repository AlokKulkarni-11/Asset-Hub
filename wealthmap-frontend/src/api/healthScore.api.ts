import api from './axios';

export interface HealthScoreResponse {
  overallScore: number;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_ATTENTION' | 'CRITICAL';
  debtScore: number;
  liquidityScore: number;
  diversificationScore: number;
  emergencyFundScore: number;
  debtToAssetRatioPct: number;
  liquidPercentage: number;
  emergencyFundMonthsCovered: number;
  maxAssetClassConcentrationPct: number;
  aiSummary: string;
  aiStrengths: string[];
  aiImprovementTips: string[];
  generatedAt: string;
}

export const healthScoreApi = {
  getHealthScore: async (): Promise<HealthScoreResponse> => {
    const res = await api.get('/health-score');
    return res.data;
  },
  refreshHealthScore: async (): Promise<HealthScoreResponse> => {
    const res = await api.post('/health-score/refresh');
    return res.data;
  }
};
