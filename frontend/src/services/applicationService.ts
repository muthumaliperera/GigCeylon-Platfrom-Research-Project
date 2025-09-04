import { api } from './api';

export type ApplicationStatus = 'applied' | 'shortlisted' | 'confirmed' | 'rejected' | 'completed';

export interface ApplicationDTO {
  _id: string;
  jobId: string;
  seekerId: string;
  status: ApplicationStatus;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  services?: string[];
  otherInfo?: string;
  createdAt?: string;
  updatedAt?: string;
  completedBySeeker?: boolean;
  completedByConnector?: boolean;
  completedBySeekerAt?: string;
  completedByConnectorAt?: string;
}

export const applicationService = {
  // Normalize API response to camelCase fields expected by the UI
  normalize(app: any): ApplicationDTO {
    if (!app) return app as ApplicationDTO;
    return {
      _id: app._id ?? app.id,
      jobId: app.jobId ?? app.job_id,
      seekerId: app.seekerId ?? app.seeker_id,
      status: (app.status ?? '').toString(),
      name: app.name,
      email: app.email,
      phone: app.phone,
      bio: app.bio,
      skills: app.skills,
      services: app.services,
      otherInfo: app.otherInfo ?? app.other_info,
      createdAt: app.createdAt ?? app.created_at,
      updatedAt: app.updatedAt ?? app.updated_at,
      // Infer booleans from multiple possible backend shapes
      completedBySeeker: (
        app.completedBySeeker ??
        app.completed_by_seeker ??
        app.seekerCompleted ??
        app.seeker_completed ??
        !!(app.completedBySeekerAt ?? app.completed_by_seeker_at)
      ) as boolean,
      completedByConnector: (
        app.completedByConnector ??
        app.completed_by_connector ??
        app.connectorCompleted ??
        app.connector_completed ??
        !!(app.completedByConnectorAt ?? app.completed_by_connector_at)
      ) as boolean,
      completedBySeekerAt: app.completedBySeekerAt ?? app.completed_by_seeker_at ?? app.seekerCompletedAt ?? app.seeker_completed_at,
      completedByConnectorAt: app.completedByConnectorAt ?? app.completed_by_connector_at ?? app.connectorCompletedAt ?? app.connector_completed_at,
    } as ApplicationDTO;
  },

  async apply(jobId: string, payload: { name?: string; email?: string; phone?: string; bio?: string; skills?: string[]; services?: string[]; otherInfo?: string; }): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/jobs/${jobId}/apply`, payload);
    return this.normalize(res.data);
    },

  async listForJob(jobId: string): Promise<ApplicationDTO[]> {
    // Add cache-busting param to avoid stale cached responses in some environments
    const res = await api.get(`/applications/jobs/${jobId}`, { params: { _ts: Date.now() } });
    return Array.isArray(res.data) ? res.data.map((a: any) => this.normalize(a)) : [];
  },

  async myApplications(): Promise<ApplicationDTO[]> {
    const res = await api.get('/applications/me');
    return Array.isArray(res.data) ? res.data.map((a: any) => this.normalize(a)) : [];
  },

  async shortlist(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/shortlist`, {});
    return this.normalize(res.data);
  },

  async reject(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/reject`, {});
    return this.normalize(res.data);
  },

  async confirmByConnector(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/confirm`, {});
    return this.normalize(res.data);
  },

  async confirmBySeeker(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/confirm-by-seeker`, {});
    return this.normalize(res.data);
  },

  async completeBySeeker(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/complete/seeker`, {});
    return this.normalize(res.data);
  },

  async completeByConnector(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/complete/connector`, {});
    return this.normalize(res.data);
  },
};
