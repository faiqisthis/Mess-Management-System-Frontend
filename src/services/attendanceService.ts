import { apiClient } from '../lib/api';

export interface Attendance {
  id: number;
  userId: number;
  date: string;
  status: number; // 0=Absent, 1=Present
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceDto {
  userId: number;
  date: string;
  status: number;
}

export interface BulkAttendanceDto {
  date: string;
  attendances: { userId: number; status: number }[];
}

export interface AttendanceSummary {
  userId: number;
  startDate: string;
  endDate: string;
  year?: number;
  month?: number;
  monthName?: string;
  attendances?: Attendance[];
  dailySummaries?: DailySummary[];
  summary?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    daysWithoutAttendance: number;
    estimatedFixedCharges: number;
    estimatedFoodCharges: number;
    estimatedTotalCost: number;
  };
  note?: string;
}

export interface DailySummary {
  date: string;
  status: string;
  meals: any[];
  dailyFixedCharge: number;
  dailyFoodCost: number;
  dailyTotalCost: number;
  menuAvailable: boolean;
}

export interface StudentInfo {
  id: number;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  roomNumber?: string;
}

export const attendanceService = {
  // Get all active students (for teachers and admins to mark attendance)
  getStudents: async (): Promise<StudentInfo[]> => {
    return apiClient.get<StudentInfo[]>('/attendance/students');
  },

  // Mark single attendance
  markAttendance: async (attendance: AttendanceDto): Promise<Attendance> => {
    return apiClient.post<Attendance>('/attendance', attendance);
  },

  // Mark bulk attendance
  markBulkAttendance: async (bulkAttendance: BulkAttendanceDto): Promise<Attendance[]> => {
    return apiClient.post<Attendance[]>('/attendance/bulk', bulkAttendance);
  },

  // Update attendance
  updateAttendance: async (id: number, status: number): Promise<Attendance> => {
    return apiClient.put<Attendance>(`/attendance/${id}`, { status });
  },

  // Get attendance by date
  getAttendanceByDate: async (date: string): Promise<Attendance[]> => {
    return apiClient.get<Attendance[]>(`/attendance/date/${date}`);
  },

  // Get user attendance with flexible filters
  getUserAttendance: async (
    userId: number,
    options?: {
      startDate?: string;
      endDate?: string;
      year?: number;
      month?: number;
      includeSummary?: boolean;
      includeMenuDetails?: boolean;
    }
  ): Promise<Attendance[] | AttendanceSummary> => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.year) params.append('year', options.year.toString());
    if (options?.month) params.append('month', options.month.toString());
    if (options?.includeSummary) params.append('includeSummary', 'true');
    if (options?.includeMenuDetails) params.append('includeMenuDetails', 'true');

    const queryString = params.toString();
    const endpoint = `/attendance/user/${userId}${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Attendance[] | AttendanceSummary>(endpoint);
  },

  // Delete attendance
  deleteAttendance: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/attendance/${id}`);
  },
};
