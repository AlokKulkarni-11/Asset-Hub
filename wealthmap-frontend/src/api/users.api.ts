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
