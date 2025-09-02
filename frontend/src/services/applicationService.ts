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
}

export const applicationService = {
  async apply(jobId: string, payload: { name?: string; email?: string; phone?: string; bio?: string; skills?: string[]; services?: string[]; otherInfo?: string; }): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/jobs/${jobId}/apply`, payload);
    return res.data;
    },

  async listForJob(jobId: string): Promise<ApplicationDTO[]> {
    const res = await api.get(`/applications/jobs/${jobId}`);
    return res.data;
  },

  async myApplications(): Promise<ApplicationDTO[]> {
    const res = await api.get('/applications/me');
    return res.data;
  },

  async shortlist(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/shortlist`, {});
    return res.data;
  },

  async reject(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/reject`, {});
    return res.data;
  },

  async confirmByConnector(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/confirm`, {});
    return res.data;
  },

  async confirmBySeeker(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/confirm-by-seeker`, {});
    return res.data;
  },

  async completeBySeeker(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/complete/seeker`, {});
    return res.data;
  },

  async completeByConnector(id: string): Promise<ApplicationDTO> {
    const res = await api.post(`/applications/${id}/complete/connector`, {});
    return res.data;
  },
};
