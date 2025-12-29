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
};
