import api from './axios';

export interface ProfileUpdateRequest {
  name: string;
  mobileNumber?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export const updateProfile = async (payload: ProfileUpdateRequest) => {
  const { data } = await api.put('/users/profile', payload);
  return data;
};

export const changePassword = async (payload: PasswordChangeRequest) => {
  const { data } = await api.put('/users/password', payload);
  return data;
};

export const forgotPassword = async (email: string) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (payload: any) => {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
};
