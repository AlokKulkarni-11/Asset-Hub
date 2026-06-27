import api from './axios';

export interface AssetResponse {
  id: number;
  name: string;
  assetType: string;
  purchaseDate: string;
  notes: string;
  familyMemberId: number;
  familyMemberName: string;
  investedAmount: number;
  currentValue: number;
  gainLoss: number;
  gainPercent: number;
}

export interface GoldRequest {
  name: string;
  purchaseDate: string;
  notes?: string;
  familyMemberId?: number;
  weightGrams: number;
  purity: string;
  purchasePrice: number;
}

export interface FDRequest {
  name: string;
  bankName: string;
  startDate: string;
  maturityDate: string;
  principalAmount: number;
  interestRate: number;
  compoundingFrequency: string;
  notes?: string;
}

export interface StockRequest {
  ticker: string;
  companyName: string;
  purchaseDate: string;
  quantity: number;
  averageBuyPrice: number;
  notes?: string;
}

export interface StockSearchResponse {
  symbol: string;
  companyName: string;
  exchange: string;
}

// Global Asset Operations
export const getAllAssets = async (): Promise<AssetResponse[]> => {
  const { data } = await api.get('/assets');
  return data;
};

export const deleteAsset = async (id: number): Promise<void> => {
  await api.delete(`/assets/${id}`);
};

// Gold Operations
export const getGoldAssets = async (): Promise<AssetResponse[]> => {
  const { data } = await api.get('/assets/gold');
  return data;
};

export const getGoldAsset = async (id: number): Promise<any> => {
  const { data } = await api.get(`/assets/gold/${id}`);
  return data;
};

export const addGoldAsset = async (payload: GoldRequest): Promise<AssetResponse> => {
  const { data } = await api.post('/assets/gold', payload);
  return data;
};

export const updateGoldAsset = async (id: number, payload: GoldRequest): Promise<AssetResponse> => {
  const { data } = await api.put(`/assets/gold/${id}`, payload);
  return data;
};

// Fixed Deposit Operations
export const getFDAssets = async (): Promise<AssetResponse[]> => {
  const { data } = await api.get('/assets/fd');
  return data;
};

export const getFDAsset = async (id: number): Promise<any> => {
  const { data } = await api.get(`/assets/fd/${id}`);
  return data;
};

export const addFDAsset = async (payload: FDRequest): Promise<AssetResponse> => {
  const { data } = await api.post('/assets/fd', payload);
  return data;
};

export const updateFDAsset = async (id: number, payload: FDRequest): Promise<AssetResponse> => {
  const { data } = await api.put(`/assets/fd/${id}`, payload);
  return data;
};

// Stock Operations
export const searchStocks = async (query: string): Promise<StockSearchResponse[]> => {
  if (!query) return [];
  const { data } = await api.get(`/assets/stock/search?query=${query}`);
  return data;
};

export const getStockAsset = async (id: number): Promise<any> => {
  const { data } = await api.get(`/assets/stock/${id}`);
  return data;
};

export const addStockAsset = async (payload: StockRequest): Promise<AssetResponse> => {
  const { data } = await api.post('/assets/stock', payload);
  return data;
};

export const updateStockAsset = async (id: number, payload: StockRequest): Promise<AssetResponse> => {
  const { data } = await api.put(`/assets/stock/${id}`, payload);
  return data;
};
