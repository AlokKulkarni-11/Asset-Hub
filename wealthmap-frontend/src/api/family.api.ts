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

export interface InviteResponse {
  id: number;
  familyName: string;
  token: string;
  createdAt: string;
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

export const inviteMember = async (name: string, email: string): Promise<string> => {
  const response = await api.post('/family/invite', { name, email });
  return response.data;
};

export const acceptInvite = async (token: string): Promise<string> => {
  const response = await api.post('/family/accept-invite', { token });
  return response.data;
};

export const leaveFamily = async (): Promise<string> => {
  const response = await api.post('/family/leave');
  return response.data;
};

export const getPendingInvites = async (): Promise<InviteResponse[]> => {
  const response = await api.get('/family/invites');
  return response.data;
};

export const getFamilyAssets = async (): Promise<any[]> => {
  const response = await api.get('/family/assets');
  return response.data;
};
