import { api } from './api';

export type Role = 'job_seeker' | 'talent_connector';

export interface AdminUserItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  phone: string; // static (server augments for now)
  rate: number; // static (server augments for now)
}

export interface PagedUsersResponse {
  items: AdminUserItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminService = {
  async listUsers(params: { role: Role; search?: string; page?: number; pageSize?: number }): Promise<PagedUsersResponse> {
    const { role, search = '', page = 1, pageSize = 10 } = params;
    const resp = await api.get('/admin/users', { params: { role, search, page, pageSize } });
    return resp.data;
  },

  async createUser(data: { firstName: string; lastName: string; email: string; password: string; role: Role }) {
    const resp = await api.post('/admin/users', data);
    return resp.data;
  },

  async updateUser(id: string, data: { firstName?: string; lastName?: string; isActive?: boolean }) {
    const resp = await api.patch(`/admin/users/${id}`, data);
    return resp.data;
  },

  async toggleActive(id: string) {
    const resp = await api.patch(`/admin/users/${id}/deactivate`, {});
    return resp.data as { id: string; isActive: boolean };
  },
};
