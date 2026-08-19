import api from './axios';

export interface LiabilityResponse {
  id: number;
  name: string;
  liabilityType: 'HOME_LOAN' | 'PERSONAL_LOAN' | 'EDUCATION_LOAN' | 'CREDIT_CARD_DEBT' | 'VEHICLE_LOAN' | 'OTHER_LIABILITY';
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  outstandingBalance: number;
  emi: number;
  startDate: string;
  notes?: string;
  familyMemberId?: number;
  familyMemberName?: string;

  // Subtype specific fields
  lenderName?: string;
  propertyAddress?: string;
  purpose?: string;
  institutionName?: string;
  cardIssuer?: string;
  lastFourDigits?: string;
  vehicleModel?: string;
  descriptionDetail?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface LiabilityRequest {
  name: string;
  liabilityType: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  outstandingBalance: number;
  emi?: number;
  startDate?: string;
  notes?: string;

  // Subtype specific fields
  lenderName?: string;
  propertyAddress?: string;
  purpose?: string;
  institutionName?: string;
  cardIssuer?: string;
  lastFourDigits?: string;
  vehicleModel?: string;
  descriptionDetail?: string;
}

export const getAllLiabilities = async (): Promise<LiabilityResponse[]> => {
  const { data } = await api.get('/liabilities');
  return data;
};

export const getLiability = async (id: number): Promise<LiabilityResponse> => {
  const { data } = await api.get(`/liabilities/${id}`);
  return data;
};

export const addLiability = async (payload: LiabilityRequest): Promise<LiabilityResponse> => {
  const { data } = await api.post('/liabilities', payload);
  return data;
};

export const updateLiability = async (id: number, payload: LiabilityRequest): Promise<LiabilityResponse> => {
  const { data } = await api.put(`/liabilities/${id}`, payload);
  return data;
};

export const deleteLiability = async (id: number): Promise<void> => {
  await api.delete(`/liabilities/${id}`);
};
