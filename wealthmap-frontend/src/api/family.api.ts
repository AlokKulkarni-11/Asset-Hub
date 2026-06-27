import api from './axios';

export interface FamilyMemberResponse {
  id: number;
  name: string;
  relationType: string;
}

export interface FamilyMemberRequest {
  name: string;
  relationType: string;
}

export const getFamilyMembers = async (): Promise<FamilyMemberResponse[]> => {
  const { data } = await api.get('/family');
  return data;
};

export const addFamilyMember = async (payload: FamilyMemberRequest): Promise<FamilyMemberResponse> => {
  const { data } = await api.post('/family', payload);
  return data;
};
