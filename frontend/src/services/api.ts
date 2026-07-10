import { request } from '../shared/api';

export interface Service {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const servicesApi = {
  list: (params?: { search?: string; isActive?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
    const qs = q.toString();
    return request<Service[]>('GET', `/services${qs ? '?' + qs : ''}`);
  },

  get: (id: string) => request<Service>('GET', `/services/${id}`),

  create: (data: { title: string; description?: string; duration: number; price: number }) =>
    request<Service>('POST', '/services', data),

  update: (id: string, data: Partial<{ title: string; description: string; duration: number; price: number }>) =>
    request<Service>('PATCH', `/services/${id}`, data),

  remove: (id: string) => request<{ message: string }>('DELETE', `/services/${id}`),
};
