import { request } from '../shared/api';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string };
}

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    request<AuthResponse>('POST', '/auth/register', data),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('POST', '/auth/login', data),

  refresh: (refreshToken: string) =>
    request<AuthResponse>('POST', '/auth/refresh', { refreshToken }),
};
