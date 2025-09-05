import { api } from './api';
import { applicationService, ApplicationDTO } from './applicationService';
import { jobService, Job } from './jobService';

export interface EarningRecord {
  _id: string;
  dateReceived: string;
  jobTitle: string;
  talentConnectorName: string;
  amount: number;
  jobId: string;
  applicationId: string;
}

export interface PaymentRecord {
  _id: string;
  paymentDate: string;
  paymentDescription: string;
  amount: number;
  invoiceUrl?: string;
  status: 'pending' | 'completed' | 'failed';
}

export const financialService = {
  async getEarnings(): Promise<EarningRecord[]> {
    try {
      // Get all applications for the current user
      const applications = await applicationService.myApplications();
      
      // Filter completed applications
      const completedApplications = applications.filter((app: ApplicationDTO) => {
        const status = (app.status || '').toString().toLowerCase();
        if (status.includes('complete')) return true;
        
        // Check if both seeker and connector have marked as completed
        const seekerCompleted = !!(app.completedBySeeker || app.completedBySeekerAt);
        const connectorCompleted = !!(app.completedByConnector || app.completedByConnectorAt);
        return seekerCompleted && connectorCompleted;
      });

      // Get job details for each completed application
      const earningsPromises = completedApplications.map(async (app: ApplicationDTO) => {
        try {
          const job = await jobService.getJobById(app.jobId);
          
          // Use the completion date as the date received
          const dateReceived = app.completedBySeekerAt || app.completedByConnectorAt || app.updatedAt || new Date().toISOString();
          
          return {
            _id: app._id,
            dateReceived: dateReceived,
            jobTitle: job.title,
            talentConnectorName: `${job.employerId.firstName} ${job.employerId.lastName}`,
            amount: job.paymentAmount || 0,
            jobId: job._id,
            applicationId: app._id
          } as EarningRecord;
        } catch (error) {
          console.error(`Failed to fetch job details for application ${app._id}:`, error);
          return null;
        }
      });

      const earnings = await Promise.all(earningsPromises);
      
      // Filter out null results and sort by date (newest first)
      return earnings
        .filter((earning): earning is EarningRecord => earning !== null)
        .sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
        
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      return [];
    }
  },

  async getPayments(): Promise<PaymentRecord[]> {
    try {
      const res = await api.get('/financial/payments');
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return [];
    }
  },

  // Mock data for development - remove when backend is ready
  getMockEarnings(): EarningRecord[] {
    return [
      {
        _id: '1',
        dateReceived: '2024-01-15',
        jobTitle: 'Website Development',
        talentConnectorName: 'John Smith',
        amount: 25000,
        jobId: 'job1',
        applicationId: 'app1'
      },
      {
        _id: '2',
        dateReceived: '2024-01-10',
        jobTitle: 'Mobile App Design',
        talentConnectorName: 'Sarah Johnson',
        amount: 18000,
        jobId: 'job2',
        applicationId: 'app2'
      },
      {
        _id: '3',
        dateReceived: '2024-01-05',
        jobTitle: 'Data Entry Task',
        talentConnectorName: 'Mike Wilson',
        amount: 5000,
        jobId: 'job3',
        applicationId: 'app3'
      }
    ];
  },

  getMockPayments(): PaymentRecord[] {
    return [
      {
        _id: '1',
        paymentDate: '2024-01-01',
        paymentDescription: 'Premium Subscription - Monthly',
        amount: 2500,
        invoiceUrl: '/invoices/inv-001.pdf',
        status: 'completed'
      },
      {
        _id: '2',
        paymentDate: '2023-12-01',
        paymentDescription: 'Premium Subscription - Monthly',
        amount: 2500,
        invoiceUrl: '/invoices/inv-002.pdf',
        status: 'completed'
      },
      {
        _id: '3',
        paymentDate: '2023-11-01',
        paymentDescription: 'Premium Subscription - Monthly',
        amount: 2500,
        invoiceUrl: '/invoices/inv-003.pdf',
        status: 'completed'
      }
    ];
  }
};
