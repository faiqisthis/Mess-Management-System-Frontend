import { apiClient } from '../lib/api';

export interface Bill {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  totalFixedCharges: number;
  totalFoodCharges: number;
  totalAmount: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  isPaid: boolean;
  paidDate?: string;
  generatedDate: string;
}

export interface GenerateBillDto {
  userId: number;
  year: number;
  month: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  monthName: string;
  totalUsers: number;
  totalBills: number;
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  bills: Bill[];
}

export const billingService = {
  // Generate monthly bill (Admin only)
  generateBill: async (dto: GenerateBillDto): Promise<Bill> => {
    return apiClient.post<Bill>('/billing/generate', dto);
  },

  // Get bill by ID
  getBillById: async (id: number): Promise<Bill> => {
    return apiClient.get<Bill>(`/billing/${id}`);
  },

  // Get user's bills
  getUserBills: async (userId: number): Promise<Bill[]> => {
    return apiClient.get<Bill[]>(`/billing/user/${userId}`);
  },

  // Get all bills (Admin only)
  getAllBills: async (): Promise<Bill[]> => {
    return apiClient.get<Bill[]>('/billing');
  },

  // Mark bill as paid (Admin only)
  markBillAsPaid: async (id: number): Promise<Bill> => {
    return apiClient.put<Bill>(`/billing/${id}/pay`, {});
  },

  // Delete bill (Admin only)
  deleteBill: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/billing/${id}`);
  },

  // Export bills as CSV
  exportBillsCSV: async (userId?: number, year?: number): Promise<Blob> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (year) params.append('year', year.toString());
    
    const queryString = params.toString();
    const endpoint = `/billing/export/csv${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export bills');
    }
    
    return response.blob();
  },

  // Get monthly report
  getMonthlyReport: async (year: number, month: number): Promise<MonthlyReport> => {
    return apiClient.get<MonthlyReport>(`/billing/reports/monthly/${year}/${month}`);
  },

  // Export monthly report as CSV
  exportMonthlyReportCSV: async (year: number, month: number): Promise<Blob> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/billing/reports/monthly/${year}/${month}/export`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to export monthly report');
    }
    
    return response.blob();
  },
};
