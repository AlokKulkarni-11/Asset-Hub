import api from './axios';
import { AssetResponse } from './assets.api';

export interface BondRequest {
  name: string;
  bondType: 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'PPF' | 'NPS' | 'SOVEREIGN_GOLD_BOND' | 'OTHER_DEBENTURE';
  issuer?: string;
  startDate: string;
  maturityDate?: string;
  investedAmount: number;
  faceValue?: number;
  quantity?: number;
  couponRate: number;
  compoundingFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'CUMULATIVE_AT_MATURITY';
  notes?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface BondResponse extends AssetResponse {
  bondType: 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'PPF' | 'NPS' | 'SOVEREIGN_GOLD_BOND' | 'OTHER_DEBENTURE';
  issuer?: string;
  couponRate: number;
  faceValue?: number;
  quantity?: number;
  compoundingFrequency?: string;
  accruedInterest?: number;
  maturityAmount?: number;
  daysToMaturity?: number;
}

export const addBond = async (data: BondRequest): Promise<AssetResponse> => {
  const response = await api.post('/api/assets/bonds', data);
  return response.data;
};

export const getAllBonds = async (): Promise<AssetResponse[]> => {
  const response = await api.get('/api/assets/bonds');
  return response.data;
};

export const getBondById = async (id: number): Promise<BondResponse> => {
  const response = await api.get(`/api/assets/bonds/${id}`);
  return response.data;
};

export const updateBond = async (id: number, data: BondRequest): Promise<BondResponse> => {
  const response = await api.put(`/api/assets/bonds/${id}`, data);
  return response.data;
};
