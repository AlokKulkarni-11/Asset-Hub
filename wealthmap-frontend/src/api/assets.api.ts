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
  
  // Multi-Currency / Forex fields
  currency?: string;
  exchangeRate?: number;
  originalInvestedAmount?: number;
  originalCurrentValue?: number;

  // Optional specific fields (Fixed Income / Bonds)
  maturityDate?: string;
  startDate?: string;
  interestRate?: number;
  bankName?: string;
  bondType?: string;
  issuer?: string;
  couponRate?: number;
  faceValue?: number;
  quantity?: number;
  compoundingFrequency?: string;
  accruedInterest?: number;
  maturityAmount?: number;
  daysToMaturity?: number;

  // Optional specific fields (ESOPs / RSUs)
  planType?: 'ESOP' | 'RSU';
  companyName?: string;
  ticker?: string;
  grantDate?: string;
  vestingStartDate?: string;
  totalUnitsGranted?: number;
  vestedUnits?: number;
  unvestedUnits?: number;
  strikePrice?: number;
  currentStockPrice?: number;
  vestedValue?: number;
  unvestedValue?: number;
  exercisableGain?: number;
  totalPotentialValue?: number;
  isLivePrice?: boolean;

  // Nominee fields
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface GoldRequest {
  name: string;
  purchaseDate: string;
  notes?: string;
  familyMemberId?: number;
  weightGrams: number;
  purity: string;
  purchasePrice: number;
  currency?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface FDRequest {
  name: string;
  bankName: string;
  startDate: string;
  maturityDate: string;
  principalAmount: number;
  interestRate: number;
  compoundingFrequency: string;
  currency?: string;
  notes?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface StockRequest {
  ticker: string;
  companyName: string;
  purchaseDate: string;
  quantity: number;
  averageBuyPrice: number;
  currency?: string;
  notes?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface MutualFundRequest {
  schemeCode: string;
  schemeName: string;
  folioNumber?: string;
  units: number;
  averageNav: number;
  purchaseDate: string;
  currency?: string;
  notes?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface RealEstateRequest {
  propertyName: string;
  propertyType: string;
  purchasePrice: number;
  estimatedCurrentValue: number;
  purchaseDate: string;
  currency?: string;
  notes?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
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

export interface MutualFundSearchResponse {
  schemeCode: number;
  schemeName: string;
}

// Mutual Fund Operations
export const addMutualFund = async (payload: MutualFundRequest): Promise<AssetResponse> => {
  const { data } = await api.post('/assets/mutualfund', payload);
  return data;
};

export const updateMutualFund = async (id: number, payload: MutualFundRequest): Promise<AssetResponse> => {
  const { data } = await api.put(`/assets/mutualfund/${id}`, payload);
  return data;
};

export const searchMutualFunds = async (query: string): Promise<MutualFundSearchResponse[]> => {
  const { data } = await api.get(`/assets/mutualfund/search?q=${query}`);
  return data;
};

export const getMutualFundAsset = async (id: number): Promise<any> => {
  const { data } = await api.get(`/assets/mutualfund/${id}`);
  return data;
};

// Real Estate Operations
export const addRealEstate = async (payload: RealEstateRequest): Promise<AssetResponse> => {
  const { data } = await api.post('/assets/realestate', payload);
  return data;
};

export const updateRealEstate = async (id: number, payload: RealEstateRequest): Promise<AssetResponse> => {
  const { data } = await api.put(`/assets/realestate/${id}`, payload);
  return data;
};

export const getRealEstateAsset = async (id: number): Promise<any> => {
  const { data } = await api.get(`/assets/realestate/${id}`);
  return data;
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

// Silver Operations
export interface SilverRequest {
  name: string;
  purchaseDate: string;
  notes?: string;
  weightGrams: number;
  purity: 'P999' | 'P925' | 'P900' | 'P800';
  purchasePrice: number;
  currency?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export const getSilverAssets = async (): Promise<AssetResponse[]> => {
  const { data } = await api.get('/assets/silver');
  return data;
};

export const getSilverAsset = async (id: number): Promise<any> => {
  const { data } = await api.get(`/assets/silver/${id}`);
  return data;
};

export const addSilverAsset = async (payload: SilverRequest): Promise<AssetResponse> => {
  const { data } = await api.post('/assets/silver', payload);
  return data;
};

export const updateSilverAsset = async (id: number, payload: SilverRequest): Promise<AssetResponse> => {
  const { data } = await api.put(`/assets/silver/${id}`, payload);
  return data;
};

export interface MetalRatesResponse {
  gold24kPerGram: number;
  gold22kPerGram: number;
  silverPerGram: number;
  currency: string;
  source: string;
}

export const getLiveMetalRates = async (): Promise<MetalRatesResponse> => {
  const { data } = await api.get('/assets/metals/rates');
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

// Crypto Operations
export interface CryptoRequest {
  coinId: string;
  symbol: string;
  name: string;
  purchaseDate: string;
  units: number;
  averageBuyPrice: number;
  currency?: string;
  notes?: string;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface CryptoSearchResponse {
  id: string;
  name: string;
  symbol: string;
}

export const searchCrypto = async (query: string): Promise<CryptoSearchResponse[]> => {
  if (!query) return [];
  const { data } = await api.get(`/assets/crypto/search?q=${query}`);
  return data;
};

export const getCryptoAsset = async (id: number): Promise<any> => {
  const { data } = await api.get(`/assets/crypto/${id}`);
  return data;
};

export const addCryptoAsset = async (payload: CryptoRequest): Promise<AssetResponse> => {
  const { data } = await api.post('/assets/crypto', payload);
  return data;
};

export const updateCryptoAsset = async (id: number, payload: CryptoRequest): Promise<AssetResponse> => {
  const { data } = await api.put(`/assets/crypto/${id}`, payload);
  return data;
};

// Forex / Currency Conversion APIs
export const getForexRates = async (): Promise<Record<string, number>> => {
  const { data } = await api.get('/forex/rates');
  return data;
};

export const getForexRate = async (from = 'USD', to = 'INR'): Promise<number> => {
  const { data } = await api.get(`/forex/rate?from=${from}&to=${to}`);
  return data;
};

export const convertCurrency = async (amount: number, from = 'USD', to = 'INR'): Promise<{
  originalAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  convertedAmount: number;
}> => {
  const { data } = await api.get(`/forex/convert?amount=${amount}&from=${from}&to=${to}`);
  return data;
};

