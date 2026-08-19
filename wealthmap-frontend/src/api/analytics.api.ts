import api from './axios';

export interface PerformanceCallout {
  assetId: number;
  name: string;
  assetType: string;
  gainPercentage: number;
  currentValue: number;
}

export interface AssetAnalytics {
  xirr: number;
  cagr: number;
  gainPercentage: number;
}

export interface AnalyticsSummary {
  portfolioXirr: number;
  portfolioCagr: number;
  warnings: string[];
  bestPerformer?: PerformanceCallout;
  worstPerformer?: PerformanceCallout;
  assetAnalytics: Record<number, AssetAnalytics>;
}

export interface BenchmarkPoint {
  date: string;
  nifty50: number;
  sensex: number;
  gold: number;
}

export interface WhatIfRequest {
  changes: Record<string, number>;
}

export interface WhatIfResponse {
  originalNetWorth: number;
  projectedNetWorth: number;
  originalTotalAssets: number;
  projectedTotalAssets: number;
  difference: number;
}

export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const { data } = await api.get('/analytics/summary');
  return data;
};

export const getBenchmarks = async (startDate: string, endDate: string): Promise<BenchmarkPoint[]> => {
  const { data } = await api.get('/analytics/benchmarks', {
    params: { startDate, endDate }
  });
  return data;
};

export const simulateWhatIf = async (payload: WhatIfRequest): Promise<WhatIfResponse> => {
  const { data } = await api.post('/analytics/what-if', payload);
  return data;
};
