import api from './axios';

export interface MemberResponse {
  id: number;
  name: string;
  email: string;
  familyRole?: string;
}

export interface FamilyDetailsResponse {
  id: number;
  name: string;
  inviteCode: string;
  creatorId: number;
  currentUserRole?: string;
  members: MemberResponse[];
}

export interface InviteResponse {
  id: number;
  familyName: string;
  token: string;
  createdAt: string;
}

export interface FamilyRollupMember {
  userId: number;
  userName: string;
  userEmail: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  contributionPercentage: number;
}

export interface FamilyRollupResponse {
  familyName: string;
  totalFamilyAssets: number;
  totalFamilyLiabilities: number;
  totalFamilyNetWorth: number;
  memberBreakdown: FamilyRollupMember[];
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

export const getFamilyRollup = async (): Promise<FamilyRollupResponse> => {
  const response = await api.get('/family/rollup');
  return response.data;
};

export const updateFamilyRole = async (userId: number, role: string): Promise<string> => {
  const response = await api.post('/family/update-role', { userId, role });
  return response.data;
};

export interface AuditLog {
  id: number;
  userEmail: string;
  userName: string;
  action: string;
  targetType: string;
  targetId?: number;
  details?: string;
  timestamp: string;
}

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  const response = await api.get('/audit-logs');
  return response.data;
};
