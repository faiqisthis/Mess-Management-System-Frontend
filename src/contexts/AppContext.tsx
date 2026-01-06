import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  currentPage: string;
  sidebarOpen: boolean;
  navigateTo: (page: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string>('menu');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        sidebarOpen,
        navigateTo,
        toggleSidebar,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
