import React, { useState, useEffect, useRef } from 'react';
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
  CogIcon,
  UsersIcon,
  LightBulbIcon,
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
        { name: 'Notifications', to: '/recycler/notifications', icon: ClipboardDocumentListIcon },
        { name: 'Forecasting', to: '/recycler/forecasting', icon: ChartBarIcon },
        { name: 'Insights', to: '/recycler/insights', icon: LightBulbIcon },
        { name: 'Profile', to: '/recycler/profile', icon: UserIcon },
      ];
    case 'admin':
      return [
        { name: 'Dashboard', to: '/admin/dashboard', icon: HomeIcon },
        { name: 'Users', to: '/admin/users', icon: UsersIcon },
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
  const [animationInView, setAnimationInView] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sidebarRef.current) {
      setAnimationInView(true);
    }
  }, []);

  const fadeInAnimation = {
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateX(0)' : 'translateX(-20px)',
    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
  };

  const slideInAnimation = (delay: number = 0) => ({
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateX(0)' : 'translateX(-30px)',
    transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-green-50/95 dark:bg-gray-800/95 backdrop-blur-sm border-r border-green-200/60 dark:border-green-800/50 shadow-lg dark:shadow-green-900/20">
          <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4" ref={sidebarRef}>
            {/* Logo/Brand */}
            <div className="flex flex-shrink-0 items-center px-6 mb-8" style={fadeInAnimation}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">WasteSense</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role} Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.to}
                  className={`group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 transform ${
                    location.pathname === item.to
                      ? 'bg-gradient-to-r from-green-100/80 to-green-100/60 dark:from-green-900/40 dark:to-blue-900/40 text-green-700 dark:text-green-300 shadow-md scale-105 translate-x-1'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-100/40 hover:to-green-100/20 dark:hover:from-gray-700/50 dark:hover:to-green-800/30 hover:text-gray-900 dark:hover:text-white'
                  } hover:scale-105 hover:translate-x-2 active:scale-95 active:translate-x-0`}
                  style={slideInAnimation(index * 0.1)}
                >
                  {/* Active indicator line */}
                  {location.pathname === item.to && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-blue-500 rounded-r-full animate-pulse"></div>
                  )}
                  
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                    location.pathname === item.to
                      ? 'text-green-600 dark:text-green-400 scale-125 rotate-3'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:scale-110 group-hover:rotate-3'
                  }`} />
                  <span className={`truncate transition-all duration-300 ${
                    location.pathname === item.to 
                      ? 'font-semibold' 
                      : 'group-hover:translate-x-1'
                  }`}>{item.name}</span>
                  
                  {/* Active state indicator */}
                  {location.pathname === item.to && (
                    <div className="ml-auto flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    </div>
                  )}
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-lg"></div>
                </Link>
              ))}
              
              {/* Logout Button */}
              <div className="pt-4 mt-4 border-t border-green-200/60 dark:border-green-800/30">
                <button
                  onClick={logout}
                  className="group relative flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 dark:hover:from-red-900/20 dark:hover:to-red-800/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 transform hover:scale-105 hover:translate-x-2 active:scale-95 active:translate-x-0"
                  style={slideInAnimation(navItems.length * 0.1)}
                >
                  <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                  <span className="transition-all duration-300 group-hover:translate-x-1">Logout</span>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-lg"></div>
                </button>
              </div>
            </nav>

            {/* User Info */}
            <div className="flex-shrink-0 px-4 py-4" style={slideInAnimation((navItems.length + 1) * 0.1)}>
              <div className="group flex items-center p-3 bg-gradient-to-r from-green-100/60 to-green-100/30 dark:from-gray-700/80 dark:to-green-800/20 rounded-lg border border-green-200/60 dark:border-green-800/30 hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-sm font-medium">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-gray-800 animate-pulse"></div>
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-300">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-green-50/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-green-200/60 dark:border-green-800/50 md:hidden shadow-lg dark:shadow-green-900/20">
        <nav className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              to={item.to}
              className={`relative flex flex-col items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 transform ${
                location.pathname === item.to
                  ? 'text-green-600 dark:text-green-400 scale-110'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
              } hover:scale-110 active:scale-95`}
            >
              {location.pathname === item.to && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              )}
              <item.icon className={`h-5 w-5 mb-1 transition-all duration-300 ${
                location.pathname === item.to ? 'scale-125 rotate-3' : 'group-hover:scale-110'
              }`} />
              <span className={`truncate transition-all duration-300 ${
                location.pathname === item.to ? 'font-semibold' : ''
              }`}>{item.name}</span>
              {location.pathname === item.to && (
                <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              )}
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