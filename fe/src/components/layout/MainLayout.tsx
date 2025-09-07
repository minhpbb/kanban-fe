'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showTabs?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showNewButton?: boolean;
  onNewClick?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  subtitle,
  showTabs = false,
  activeTab = 'kanban',
  onTabChange,
  showNewButton = false,
  onNewClick
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header
          title={title}
          subtitle={subtitle}
          showTabs={showTabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          showNewButton={showNewButton}
          onNewClick={onNewClick}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
