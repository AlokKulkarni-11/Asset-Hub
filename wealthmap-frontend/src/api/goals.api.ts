import api from './axios';

export interface GoalRequest {
  name: string;
  targetAmount: number;
  targetDate?: string;
  notes?: string;
  taggedAssetIds?: number[];
  shared?: boolean;
}

export interface GoalResponse {
  id: number;
  name: string;
  targetAmount: number;
  targetDate?: string;
  notes?: string;
  taggedAssetIds: number[];
  currentSavedAmount: number;
  progressPercentage: number;
  shared: boolean;
  familyGroupId?: number;
}

export const getAllGoals = async (): Promise<GoalResponse[]> => {
  const { data } = await api.get('/goals');
  return data;
};

export const createGoal = async (payload: GoalRequest): Promise<GoalResponse> => {
  const { data } = await api.post('/goals', payload);
  return data;
};

export const updateGoal = async (id: number, payload: GoalRequest): Promise<GoalResponse> => {
  const { data } = await api.put(`/goals/${id}`, payload);
  return data;
};

export const deleteGoal = async (id: number): Promise<void> => {
  await api.delete(`/goals/${id}`);
};
