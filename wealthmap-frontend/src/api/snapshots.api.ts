import api from './axios';

export interface SnapshotResponse {
  date: string;
  totalNetWorth: number;
  totalInvested: number;
}

export const getSnapshots = async (): Promise<SnapshotResponse[]> => {
  const response = await api.get('/snapshots');
  return response.data;
};

export const captureSnapshot = async (): Promise<SnapshotResponse> => {
  const response = await api.post('/snapshots/capture');
  return response.data;
};
