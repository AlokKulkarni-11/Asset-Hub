import api from './axios';
import { AssetResponse } from './assets.api';

export interface EsopRsuRequest {
  name: string;
  planType: 'ESOP' | 'RSU';
  companyName: string;
  ticker?: string;
  grantDate?: string;
  vestingStartDate?: string;
  totalUnitsGranted: number;
  vestedUnits: number;
  unvestedUnits?: number;
  strikePrice?: number;
  currentStockPrice: number;
  currency?: string;
  notes?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface EsopRsuResponse extends AssetResponse {
  planType: 'ESOP' | 'RSU';
  companyName: string;
  ticker?: string;
  grantDate?: string;
  vestingStartDate?: string;
  totalUnitsGranted: number;
  vestedUnits: number;
  unvestedUnits: number;
  strikePrice: number;
  currentStockPrice: number;
  currency: string;
  vestedValue: number;
  unvestedValue: number;
  exercisableGain: number;
  totalPotentialValue: number;
  isLivePrice: boolean;
}

export const addEsopRsu = async (data: EsopRsuRequest): Promise<AssetResponse> => {
  const response = await api.post('/api/assets/esops', data);
  return response.data;
};

export const getAllEsopRsus = async (): Promise<AssetResponse[]> => {
  const response = await api.get('/api/assets/esops');
  return response.data;
};

export const getEsopRsuById = async (id: number): Promise<EsopRsuResponse> => {
  const response = await api.get(`/api/assets/esops/${id}`);
  return response.data;
};

export const updateEsopRsu = async (id: number, data: EsopRsuRequest): Promise<EsopRsuResponse> => {
  const response = await api.put(`/api/assets/esops/${id}`, data);
  return response.data;
};
