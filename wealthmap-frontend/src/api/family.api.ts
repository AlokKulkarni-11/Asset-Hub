import api from './axios';

export interface MemberResponse {
  id: number;
  name: string;
  email: string;
}

export interface FamilyDetailsResponse {
  id: number;
  name: string;
  inviteCode: string;
  creatorId: number;
  members: MemberResponse[];
}

export const getMyFamily = async (): Promise<FamilyDetailsResponse | null> => {
  const response = await api.get('/family/me');
  if (response.status === 204) return null;
  return response.data;
};

export const createFamily = async (name: string): Promise<FamilyDetailsResponse> => {
  const response = await api.post('/family/create', { name });
  return response.data;
};

export const joinFamily = async (inviteCode: string): Promise<FamilyDetailsResponse> => {
  const response = await api.post('/family/join', { inviteCode });
  return response.data;
};

export const addMember = async (email: string): Promise<void> => {
  await api.post('/family/add-member', { email });
};

export const getFamilyAssets = async (): Promise<any[]> => {
  const response = await api.get('/family/assets');
  return response.data;
};
