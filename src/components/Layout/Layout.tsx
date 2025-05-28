import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  UserIcon,
  TruckIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const getNavItems = (role: string): NavItem[] => {
  switch (role) {
    case 'resident':
      return [
        { name: 'Dashboard', to: '/resident/dashboard', icon: HomeIcon },
        { name: 'Reports', to: '/resident/reports', icon: ClipboardDocumentListIcon },
        { name: 'Schedule', to: '/resident/schedule', icon: CalendarIcon },
        { name: 'Profile', to: '/resident/profile', icon: UserIcon },
      ];
    case 'dispatcher':
      return [
        { name: 'Dashboard', to: '/dispatcher/dashboard', icon: HomeIcon },
        { name: 'Routes', to: '/dispatcher/routes', icon: TruckIcon },
        { name: 'Analytics', to: '/dispatcher/analytics', icon: ChartBarIcon },
        { name: 'Profile', to: '/dispatcher/profile', icon: UserIcon },
      ];
    case 'recycler':
      return [
        { name: 'Dashboard', to: '/recycler/dashboard', icon: HomeIcon },
        { name: 'Deliveries', to: '/recycler/deliveries', icon: TruckIcon },
        { name: 'Insights', to: '/recycler/insights', icon: ChartBarIcon },
        { name: 'Profile', to: '/recycler/profile', icon: UserIcon },
      ];
    default:
      return [];
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navItems = user ? getNavItems(user.role) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">WasteSense</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.to}
                  className={`nav-link dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white ${
                    location.pathname === item.to ? 'active dark:bg-gray-700 dark:text-white' : ''
                  }`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={logout}
                className="nav-link w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
              >
                <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <nav className="flex justify-around">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              to={item.to}
              className={`nav-link-mobile dark:text-gray-300 ${
                location.pathname === item.to ? 'active dark:text-white' : ''
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 