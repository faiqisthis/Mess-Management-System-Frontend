import { apiClient } from '../lib/api';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: number; // 0=Student, 1=Teacher, 2=Admin
  isActive: boolean;
  createdAt: string;
  rollNumber?: string;
  roomNumber?: string;
  contactNumber?: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: number;
  rollNumber?: string;
  roomNumber?: string;
  contactNumber?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: number;
  isActive?: boolean;
  rollNumber?: string;
  roomNumber?: string;
  contactNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword: string;
}

export const userService = {
  // Create user (Admin only)
  createUser: async (user: CreateUserDto): Promise<User> => {
    return apiClient.post<User>('/users', user);
  },

  // Get all users (Admin only)
  getAllUsers: async (): Promise<User[]> => {
    return apiClient.get<User[]>('/users');
  },

  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  // Update user (Admin only - partial updates supported)
  updateUser: async (id: number, user: UpdateUserDto): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, user);
  },

  // Change password
  changePassword: async (id: number, dto: ChangePasswordDto): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/users/${id}/change-password`, dto);
  },

  // Delete user (Admin only)
  deleteUser: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/users/${id}`);
  },
};
