import api from './axios';

export interface AiParseAssetResponse {
  assetType?: string;
  liabilityType?: string;
  isLiability?: boolean;
  rawInput?: string;
  fields?: Record<string, any>;
  confidenceScore?: number;
  summary?: string;
  ambiguous?: boolean;
  name?: string;
  purchasePrice?: number;
  currentValue?: number;
  quantity?: number;
  purchaseDate?: string;
  startDate?: string;
  maturityDate?: string;
  interestRate?: number;
  principalAmount?: number;
  outstandingBalance?: number;
  monthlyEmi?: number;
  emi?: number;
  tenureMonths?: number;
  symbol?: string;
  ticker?: string;
  category?: string;
  confidence?: number;
  notes?: string;
  [key: string]: any;
}

export interface AiChatRequest {
  message: string;
  history?: { role: string; content: string }[];
}

export interface AiChatResponse {
  reply: string;
  groundedInRealData: boolean;
  referencedDataPoints?: string[];
  suggestedFollowUps?: string[];
}

export interface AnomalyCheckRequest {
  assetType: string;
  values: Record<string, any>;
}

export interface AnomalyCheckResponse {
  isAnomaly: boolean;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  fieldName?: string;
  warningMessage?: string;
  suggestedCorrection?: string;
}

export const aiApi = {
  parseAsset: async (text: string): Promise<AiParseAssetResponse> => {
    const res = await api.post('/ai/parse-asset', { text });
    return res.data;
  },
  getNarrative: async (): Promise<{ narrative: string }> => {
    const res = await api.get('/ai/narrative');
    return res.data;
  },
  refreshNarrative: async (): Promise<{ narrative: string }> => {
    const res = await api.post('/ai/narrative/refresh');
    return res.data;
  },
  chat: async (req: AiChatRequest): Promise<AiChatResponse> => {
    const res = await api.post('/ai/chat', req);
    return res.data;
  },
  checkAnomaly: async (req: AnomalyCheckRequest): Promise<AnomalyCheckResponse> => {
    const res = await api.post('/ai/anomaly-check', req);
    return res.data;
  }
};
