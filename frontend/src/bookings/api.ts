import { request } from '../shared/api';
import { Service } from '../services/api';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  service?: Service;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const bookingsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return request<PaginatedResponse<Booking>>('GET', `/bookings${qs ? '?' + qs : ''}`);
  },

  get: (id: string) => request<Booking>('GET', `/bookings/${id}`),

  create: (data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceId: string;
    bookingDate: string;
    bookingTime: string;
    notes?: string;
  }) => request<Booking>('POST', '/bookings', data),

  updateStatus: (id: string, status: BookingStatus) =>
    request<Booking>('PATCH', `/bookings/${id}/status`, { status }),

  cancel: (id: string) => request<{ message: string; booking: Booking }>('DELETE', `/bookings/${id}`),
};
