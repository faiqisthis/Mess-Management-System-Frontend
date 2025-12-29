import { apiClient } from '../lib/api';

export interface Meal {
  name: string;
  type: number; // 0=Breakfast, 1=Lunch, 2=Dinner
  price: number;
}

export interface DailyMenu {
  id: number;
  date: string;
  meals: Meal[];
  dailyFixedCharge: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuDto {
  date: string;
  meals: Meal[];
  dailyFixedCharge: number;
}

export interface UpdateMenuDto {
  meals?: Meal[];
  dailyFixedCharge?: number;
}

export const menuService = {
  // Get menu by date
  getMenuByDate: async (date: string): Promise<DailyMenu> => {
    return apiClient.get<DailyMenu>(`/dailymenu/date/${date}`);
  },

  // Get menus in date range
  getMenusInRange: async (startDate: string, endDate: string): Promise<DailyMenu[]> => {
    return apiClient.get<DailyMenu[]>(`/dailymenu/range?startDate=${startDate}&endDate=${endDate}`);
  },

  // Create menu (Admin only)
  createMenu: async (menu: CreateMenuDto): Promise<DailyMenu> => {
    return apiClient.post<DailyMenu>('/dailymenu', menu);
  },

  // Update menu (Admin only)
  updateMenu: async (id: number, menu: UpdateMenuDto): Promise<DailyMenu> => {
    return apiClient.put<DailyMenu>(`/dailymenu/${id}`, menu);
  },

  // Delete menu (Admin only)
  deleteMenu: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/dailymenu/${id}`);
  },
};
