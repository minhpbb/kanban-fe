'use client';

import {
  CloseOutlined,
  FolderOutlined,
  HomeOutlined,
  MenuOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

const Sidebar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    { icon: <HomeOutlined />, label: 'Home', href: '/home', active: pathname === '/home' },
    { icon: <FolderOutlined />, label: 'Projects', href: '/projects', active: pathname === '/projects' },
    // { icon: <CheckSquareOutlined />, label: 'My Tasks', href: '/dashboard', active: pathname === '/dashboard' },
    // { icon: <TeamOutlined />, label: 'Members', href: '/members', active: pathname === '/members' },
    // { icon: <SettingOutlined />, label: 'Settings', href: '/settings', active: pathname === '/settings' },
  ];


  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed lg:relative z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚡</span>
            </div>
            <span className="text-xl font-semibold text-gray-800">Logoipsum</span>
          </div>
        </div>


        {/* Navigation */}
        <div className="flex-1 p-6">
                  <nav className="space-y-2">
          {navigationItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  item.active 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
