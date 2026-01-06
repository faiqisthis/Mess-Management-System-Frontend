import React from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { MenuPage } from './components/MenuPage';
import { AttendancePage } from './components/AttendancePage';
import { AdminMenuManagement } from './components/AdminMenuManagement';
import { BillingPage } from './components/BillingPage';
import { UserManagement } from './components/UserManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';

export type UserRole = 'Student' | 'Teacher' | 'Admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const { currentPage, navigateTo } = useApp();

  const handleLogout = () => {
    logout();
    navigateTo('menu');
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const currentUser: User = {
    id: user!.userId.toString(),
    username: user!.email.split('@')[0],
    name: user!.email,
    role: user!.role as UserRole,
    email: user!.email,
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'menu':
        return <MenuPage />;
      case 'attendance':
        return <AttendancePage userRole={currentUser.role} userId={currentUser.id} />;
      case 'admin-menu':
        return <AdminMenuManagement />;
      case 'billing':
        return <BillingPage userRole={currentUser.role} userId={currentUser.id} />;
      case 'users':
        return <UserManagement />;
      default:
        return <MenuPage />;
    }
  };

  return (
    <DashboardLayout
      currentUser={currentUser}
      currentPage={currentPage}
      onNavigate={navigateTo}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
