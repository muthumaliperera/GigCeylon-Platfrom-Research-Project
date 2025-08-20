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

export interface DashboardStats {
  users: {
    total: number;
    jobSeekers: number;
    talentConnectors: number;
  };
  jobs: {
    total: number;
    active: number;
    completed: number;
  };
}

export type ApprovalTab = 'pending' | 'approved' | 'rejected';
export type ApprovedFilter = 'all' | 'active' | 'expired' | 'deactivated';

export interface AdminJobItem {
  _id: string;
  title: string;
  status: string;
  isActive?: boolean;
  approvalStatus: ApprovalTab;
  rejectedReason?: string;
  createdAt?: string;
  completionDeadline?: string;
  employerId?: { firstName?: string; lastName?: string; email?: string } | string;
}

export interface PagedJobsResponse {
  items: AdminJobItem[];
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

  async getDashboardStats(): Promise<DashboardStats> {
    const resp = await api.get('/admin/dashboard/stats');
    return resp.data;
  },

  // Jobs approval management
  async listJobs(params: {
    approval: ApprovalTab;
    filter?: ApprovedFilter;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedJobsResponse> {
    const { approval, filter = 'all', search = '', page = 1, pageSize = 10 } = params;
    const resp = await api.get('/admin/jobs', {
      params: { approval, filter, search, page, pageSize },
    });
    return resp.data;
  },

  async approveJob(id: string) {
    const resp = await api.patch(`/admin/jobs/${id}/approve`, {});
    return resp.data as { id: string; approvalStatus: 'approved' };
  },

  async rejectJob(id: string, reason: string) {
    const resp = await api.patch(`/admin/jobs/${id}/reject`, { reason });
    return resp.data as { id: string; approvalStatus: 'rejected'; rejectedReason: string };
  },

  async migrateJobsApproval() {
    const resp = await api.post('/admin/jobs/migrate-approval', {});
    return resp.data as { matched: number; modified: number };
  },
};
