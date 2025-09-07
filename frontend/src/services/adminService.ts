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
    pendingApproval: number;
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

// Reviews
export interface ReviewItem {
  _id: string;
  rating: number; // 1-5
  comment?: string;
  reviewer?: { firstName?: string; lastName?: string; email?: string } | string;
  reviewee?: { firstName?: string; lastName?: string; email?: string } | string;
  jobId?: { _id?: string; title?: string } | string;
  createdAt?: string;
}

export interface PagedReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}

// Payment plans
export type PlanInterval = 'monthly' | 'yearly';
export type PlanAudience = Role | 'both';

export interface PaymentPlan {
  _id: string;
  name: string;
  price: number;
  interval: PlanInterval;
  audience: PlanAudience; // who this plan applies to
  subHeader?: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

// Admin view: earnings per job seeker (for modal)
export interface SeekerEarningItem {
  appliedDate: string; // ISO date
  jobTitle: string;
  talentConnector: string;
  amount: number; // LKR
  jobId?: string;
  applicationId?: string;
}

// Admin view: spendings per talent connector (for modal)
export interface ConnectorSpendingItem {
  paidDate: string; // ISO date
  jobTitle: string;
  candidate: string; // seeker name
  amount: number; // LKR
  jobId?: string;
  applicationId?: string;
}

export type FinanceUserType = 'job_seeker' | 'talent_connector';
export type FinanceStatus = 'paid' | 'pending' | 'failed';
export interface FinanceRecord {
  date: string; // ISO date
  userName: string;
  userType: FinanceUserType;
  amount: number;
  status: FinanceStatus;
  invoiceNumber?: string;
}

export interface CreatePlanDto {
  name: string;
  price: number;
  interval: PlanInterval;
  audience: PlanAudience;
  subHeader?: string;
  features: string[];
}

export interface UpdatePlanDto {
  name?: string;
  price?: number;
  interval?: PlanInterval;
  audience?: PlanAudience;
  subHeader?: string;
  features?: string[];
  isActive?: boolean;
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

  // Payment Plans
  async listPlans(): Promise<PaymentPlan[]> {
    const resp = await api.get('/admin/plans');
    return resp.data as PaymentPlan[];
  },

  async createPlan(data: CreatePlanDto): Promise<PaymentPlan> {
    const resp = await api.post('/admin/plans', data);
    return resp.data as PaymentPlan;
  },

  async updatePlan(id: string, data: UpdatePlanDto): Promise<PaymentPlan> {
    const resp = await api.patch(`/admin/plans/${id}`, data);
    return resp.data as PaymentPlan;
  },

  async deletePlan(id: string): Promise<{ id: string }> {
    const resp = await api.delete(`/admin/plans/${id}`);
    return resp.data as { id: string };
  },

  // Reviews
  async listReviews(params: { search?: string; page?: number; pageSize?: number }): Promise<PagedReviewsResponse> {
    const { search = '', page = 1, pageSize = 10 } = params;
    const resp = await api.get('/admin/reviews', { params: { search, page, pageSize } });
    return resp.data as PagedReviewsResponse;
  },

  // Earnings for a specific job seeker (admin only)
  async getSeekerEarnings(userId: string): Promise<SeekerEarningItem[]> {
    const resp = await api.get(`/admin/users/${userId}/earnings`);
    // Normalize potential backend field names to the interface
    const items = Array.isArray(resp.data) ? resp.data : [];
    return items.map((it: any) => ({
      appliedDate: it.appliedDate ?? it.applied_date ?? it.dateReceived ?? it.date_received ?? it.createdAt ?? it.created_at ?? new Date().toISOString(),
      jobTitle: it.jobTitle ?? it.job_title ?? it.title ?? '',
      talentConnector: it.talentConnector ?? it.talent_connector ?? it.employerName ?? it.employer_name ?? it.connectorName ?? '',
      amount: Number(it.amount ?? it.total ?? 0),
      jobId: it.jobId ?? it.job_id,
      applicationId: it.applicationId ?? it.application_id,
    })) as SeekerEarningItem[];
  },

  // Spendings for a specific talent connector (admin only)
  async getConnectorSpendings(userId: string): Promise<ConnectorSpendingItem[]> {
    const resp = await api.get(`/admin/users/${userId}/spendings`);
    const items = Array.isArray(resp.data) ? resp.data : [];
    return items.map((it: any) => ({
      paidDate: it.paidDate ?? it.paid_date ?? it.datePaid ?? it.date_paid ?? it.createdAt ?? it.created_at ?? new Date().toISOString(),
      jobTitle: it.jobTitle ?? it.job_title ?? it.title ?? '',
      candidate: it.candidate ?? it.seekerName ?? it.seeker_name ?? '',
      amount: Number(it.amount ?? it.total ?? 0),
      jobId: it.jobId ?? it.job_id,
      applicationId: it.applicationId ?? it.application_id,
    })) as ConnectorSpendingItem[];
  },

  // Finance records for admin
  async listFinance(): Promise<FinanceRecord[]> {
    const resp = await api.get('/admin/finance');
    const items = Array.isArray(resp.data) ? resp.data : [];
    return items.map((it: any) => ({
      date: it.date ?? it.paidDate ?? it.paid_date ?? it.createdAt ?? it.created_at ?? new Date().toISOString(),
      userName: it.userName ?? it.user_name ?? '',
      userType: (it.userType ?? it.user_type ?? 'job_seeker') as FinanceUserType,
      amount: Number(it.amount ?? 0),
      status: (it.status ?? 'paid') as FinanceStatus,
      invoiceNumber: it.invoiceNumber ?? it.invoice_number,
    }));
  },
};

