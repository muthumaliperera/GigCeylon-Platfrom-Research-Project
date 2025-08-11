import { api } from './api';

export interface JobFormData {
  title: string;
  category: string;
  description: string;
  location: string;
  specificArea: string;
  expectedDuration: string;
completionDeadline: string;
paymentType: string;
  paymentAmount: number;
  basicRequirements: string;
  whatYouProvide: string;
  preferredContactMethod: string;
  urgency: string;
  additionalNotes: string;
  
}
export interface Job{
  _id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  specificArea: string;
  expectedDuration: string;
completionDeadline: string;
paymentType: string;
  paymentAmount: number;
  basicRequirements: string;
  whatYouProvide: string;
  preferredContactMethod: string;
  urgency: string;
  additionalNotes: string;
  employerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  applicationsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pages: number;
}
export const jobService = {
  // Create a new job
  createJob: async (jobData: JobFormData): Promise<Job> => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // Get jobs by current employer
  getMyJobs: async (page: number = 1, limit: number = 10): Promise<JobsResponse> => {
    const response = await api.get(`/jobs/my-jobs?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get active jobs (for job seekers)
  getActiveJobs: async (
    page: number = 1,
    limit: number = 10,
    category?: string,
    location?: string
  ): Promise<JobsResponse> => {
    let url = `/jobs/active?page=${page}&limit=${limit}`;
    if (category) url += `&category=${category}`;
    if (location) url += `&location=${location}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Get public jobs for landing page (active + completed)
  getPublicJobs: async (
    page: number = 1,
    limit: number = 10,
    category?: string,
    location?: string
  ): Promise<JobsResponse> => {
    let url = `/jobs/public?page=${page}&limit=${limit}`;
    if (category) url += `&category=${category}`;
    if (location) url += `&location=${location}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get job by ID
  getJobById: async (jobId: string): Promise<Job> => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Update job
  updateJob: async (jobId: string, jobData: Partial<JobFormData>): Promise<Job> => {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  // Update job status
  updateJobStatus: async (jobId: string, status: string): Promise<Job> => {
    const response = await api.put(`/jobs/${jobId}/status`, { status });
    return response.data;
  },

  // Delete job
  deleteJob: async (jobId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },
};

// Job categories for form dropdown
export const JOB_CATEGORIES = [
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'retail_sales', label: 'Retail & Sales' },
  { value: 'delivery_services', label: 'Delivery Services' },
  { value: 'data_entry', label: 'Data Entry' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'content_writing', label: 'Content Writing' },
  { value: 'graphic_design', label: 'Graphic Design' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event_assistance', label: 'Event Assistance' },
  { value: 'cleaning_services', label: 'Cleaning Services' },
  { value: 'other', label: 'Other' },
];

// Payment types
export const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash Payment' },
  { value: 'online', label: 'Online Payment' },
  { value: 'both', label: 'Both' },
];

// Contact methods
export const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'platform_message', label: 'Platform Message' },
];

// Urgency levels
export const URGENCY_LEVELS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'not_urgent', label: 'Not Urgent' },
];

// Duration options
export const DURATION_OPTIONS = [
  { value: '1-2 hours', label: '1-2 hours' },
  { value: '3-4 hours', label: '3-4 hours' },
  { value: '5-8 hours (1 day)', label: '5-8 hours (1 day)' },
  { value: '2-3 days', label: '2-3 days' },
  { value: '1 week', label: '1 week' },
  { value: '2-4 weeks', label: '2-4 weeks' },
  { value: '1-2 months', label: '1-2 months' },
  { value: 'More than 2 months', label: 'More than 2 months' },
];

// Sri Lankan cities for location dropdown
export const SRI_LANKAN_CITIES = [
  { value: 'Colombo', label: 'Colombo' },
  { value: 'Kandy', label: 'Kandy' },
  { value: 'Galle', label: 'Galle' },
  { value: 'Negombo', label: 'Negombo' },
  { value: 'Jaffna', label: 'Jaffna' },
  { value: 'Batticaloa', label: 'Batticaloa' },
  { value: 'Matara', label: 'Matara' },
  { value: 'Ratnapura', label: 'Ratnapura' },
  { value: 'Kurunegala', label: 'Kurunegala' },
  { value: 'Anuradhapura', label: 'Anuradhapura' },
  { value: 'Trincomalee', label: 'Trincomalee' },
  { value: 'Badulla', label: 'Badulla' },
  { value: 'Other', label: 'Other' },
];