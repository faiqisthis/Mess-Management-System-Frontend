import React from 'react';
import { User } from '../App';
import { Menu, X, Calendar, DollarSign, Users, LogOut, Settings, Utensils } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface DashboardLayoutProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function DashboardLayout({ currentUser, currentPage, onNavigate, onLogout, children }: DashboardLayoutProps) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useApp();

  const menuItems = [
    { id: 'menu', label: 'Menu', icon: Utensils, roles: ['Student', 'Teacher', 'Admin'] },
    { id: 'attendance', label: 'Attendance', icon: Calendar, roles: ['Student', 'Teacher', 'Admin'] },
    { id: 'billing', label: 'Billing', icon: DollarSign, roles: ['Student', 'Teacher', 'Admin'] },
    { id: 'admin-menu', label: 'Menu Management', icon: Settings, roles: ['Admin'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['Admin'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  const getRoleBadgeColor = (role: string) => {
    const normalizedRole = role.toLowerCase();
    switch (normalizedRole) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'student':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-lg">Mess Management</h1>
        <div className="w-10"></div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 z-30 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mess System
          </h1>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{currentUser.name}</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs border ${getRoleBadgeColor(
                  currentUser.role
                )}`}
              >
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
