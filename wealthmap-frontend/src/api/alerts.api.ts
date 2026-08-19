import api from './axios';

export interface PriceAlertResponse {
  id: number;
  assetId?: number;
  assetName: string;
  assetType: string;
  targetPrice: number;
  alertCondition: 'ABOVE' | 'BELOW' | string;
  active: boolean;
  lastObservedPrice?: number;
  lastTriggeredAt?: string;
  createdAt?: string;
}

export interface PriceAlertRequest {
  assetId?: number;
  assetName: string;
  assetType: string;
  targetPrice: number;
  alertCondition: 'ABOVE' | 'BELOW' | string;
}

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
}

export interface RebalancingResponse {
  targetEquityPct: number;
  targetDebtPct: number;
  targetGoldPct: number;
  currentEquityPct: number;
  currentDebtPct: number;
  currentGoldPct: number;
  equityDriftPct: number;
  debtDriftPct: number;
  goldDriftPct: number;
  driftThresholdPct: number;
  needsRebalancing: boolean;
  nudgeMessage: string;
  recommendedEquityAdjustment: number;
  recommendedDebtAdjustment: number;
  recommendedGoldAdjustment: number;
}

export interface RebalancingRequest {
  targetEquityPct: number;
  targetDebtPct: number;
  targetGoldPct: number;
  driftThresholdPct: number;
}

export const getPriceAlerts = async (): Promise<PriceAlertResponse[]> => {
  const { data } = await api.get('/alerts/price');
  return data;
};

export const createPriceAlert = async (payload: PriceAlertRequest): Promise<PriceAlertResponse> => {
  const { data } = await api.post('/alerts/price', payload);
  return data;
};

export const deletePriceAlert = async (id: number): Promise<void> => {
  await api.delete(`/alerts/price/${id}`);
};

export const getNotifications = async (): Promise<NotificationResponse[]> => {
  const { data } = await api.get('/alerts/notifications');
  return data;
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await api.post(`/alerts/notifications/${id}/read`);
};

export const getRebalancingStatus = async (): Promise<RebalancingResponse> => {
  const { data } = await api.get('/alerts/rebalancing');
  return data;
};

export const saveRebalancingTarget = async (payload: RebalancingRequest): Promise<RebalancingResponse> => {
  const { data } = await api.post('/alerts/rebalancing', payload);
  return data;
};
