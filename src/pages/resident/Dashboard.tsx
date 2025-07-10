import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../hooks/useReports';
import { useTheme } from '../../context/ThemeContext';
import { environment } from '../../config/environment';
import axios from 'axios';

interface CollectionSchedule {
  id: string;
  zone: string;
  scheduledStart: string;
  estimatedCompletion: string;
  status: string;
  reportsCount: number;
  driverName: string;
  driverContact: string;
  vehicle: {
    make: string;
    model: string;
    registrationNumber: string;
    type: string;
  };
}

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { reports, loading } = useReports();
  const { isDarkMode } = useTheme();
  const [showReportModal, setShowReportModal] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  // Animation states
  const [animationInView, setAnimationInView] = useState(false);
  const [cardsInView, setCardsInView] = useState(false);
  const [reportsInView, setReportsInView] = useState(false);
  const [tipsInView, setTipsInView] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<HTMLDivElement>(null);

  const hasActiveReport = reports.some(
    (r) => r.status === 'new' || r.status === 'in-progress'
  );

  // Fetch collection schedules for the user's zone
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.zone) return;
      
      setSchedulesLoading(true);
      try {
        const API_BASE_URL = environment.getApiUrl();
        const response = await axios.get(`${API_BASE_URL}/auth/schedules?zone=${encodeURIComponent(user.zone)}`);
        setSchedules(response.data.schedules);
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
      } finally {
        setSchedulesLoading(false);
      }
    };

    fetchSchedules();
    // Refresh schedules every 30 seconds
    const interval = setInterval(fetchSchedules, 30000);
    return () => clearInterval(interval);
  }, [user?.zone, reports]);

  // Animation observers
  useEffect(() => {
    const observers = [];

    // Dashboard header animation
    if (dashboardRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setAnimationInView(true);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(dashboardRef.current);
      observers.push(observer);
    }

    // Cards animation
    if (cardsRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCardsInView(true);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(cardsRef.current);
      observers.push(observer);
    }

    // Reports animation
    if (reportsRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setReportsInView(true);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(reportsRef.current);
      observers.push(observer);
    }

    // Tips animation
    if (tipsRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTipsInView(true);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(tipsRef.current);
      observers.push(observer);
    }

    return () => observers.forEach(observer => observer.disconnect());
  }, []);

  const getNextSchedule = (): CollectionSchedule | null => {
    const now = new Date();
    const upcomingSchedules = schedules
      .filter(schedule => new Date(schedule.scheduledStart) > now)
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    
    return upcomingSchedules[0] || null;
  };

  const getActiveSchedule = (): CollectionSchedule | null => {
    const now = new Date();
    return schedules.find(schedule => 
      (schedule.status === 'in-progress') || 
      (schedule.status === 'scheduled' && new Date(schedule.scheduledStart) <= now && new Date(schedule.estimatedCompletion) >= now)
    ) || null;
  };

  const getRecentCompletedSchedule = (): CollectionSchedule | null => {
    // Only show completed schedule if there are no active or scheduled collections
    const hasActiveOrScheduled = schedules.some(schedule => 
      schedule.status === 'scheduled' || schedule.status === 'in-progress'
    );
    
    if (hasActiveOrScheduled) {
      return null; // Don't show completed if there are active/scheduled collections
    }
    
    // Find the most recent completed schedule (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCompleted = schedules
      .filter(schedule => 
        schedule.status === 'completed' && 
        new Date(schedule.estimatedCompletion) > oneDayAgo
      )
      .sort((a, b) => new Date(b.estimatedCompletion).getTime() - new Date(a.estimatedCompletion).getTime());
    
    return recentCompleted[0] || null;
  };

  const handleOpenModal = () => {
    setShowReportModal(true);
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Missing user');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const API_BASE_URL = environment.getApiUrl();
      await axios.post(`${API_BASE_URL}/auth/report-bin-full`, {
        userId: user.id,
        description,
      });
      setSuccess(true);
      setShowReportModal(false);
      setDescription('');
    } catch (err: any) {
      // Show backend error message if available
      const backendMsg = err?.response?.data?.message;
      setError(backendMsg || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const nextSchedule = getNextSchedule();
  const activeSchedule = getActiveSchedule();
  const recentCompletedSchedule = getRecentCompletedSchedule();

  return (
    <div className={`min-h-screen transition-all duration-700 ease-out ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950' : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div ref={dashboardRef} className={`mb-12 transition-all duration-700 ease-out ${animationInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className={`flex items-center space-x-6 transition-all duration-600 ease-out delay-100 ${animationInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl tracking-wide">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className={`text-4xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-white via-blue-100 to-emerald-200' : 'from-gray-900 via-blue-900 to-emerald-900'} bg-clip-text text-transparent`}>
                  Welcome back!
                </h1>
                <div className="flex items-center space-x-3">
                  <div className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {user?.name || 'Resident'}
                  </div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {user?.zone || 'Zone not assigned'}
                  </span>
                </div>
              </div>
            </div>
            <div className={`mt-6 sm:mt-0 transition-all duration-600 ease-out delay-200 ${animationInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
              <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/30' : 'bg-white/40'} backdrop-blur-xl rounded-2xl p-4 border ${isDarkMode ? 'border-gray-700/50' : 'border-white/20'} shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500`}>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-30"></div>
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      System Status
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      All services operational
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-emerald-500 transform group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Report Bin Full Card */}
          <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/20' : 'bg-white/60'} backdrop-blur-xl rounded-3xl p-8 border ${isDarkMode ? 'border-gray-700/30' : 'border-white/30'} shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-700 ease-out ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} delay-100`}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-700"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <svg className="w-8 h-8 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <div className={`text-right transition-all duration-500 group-hover:translate-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-sm font-semibold tracking-wide">Quick Report</div>
                  <div className="text-xs opacity-70">Instant Alert</div>
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-3 transition-all duration-500 group-hover:text-red-500 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Report Bin Full
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Instantly notify our collection team when your bin needs immediate attention
              </p>
              {hasActiveReport && (
                <div className={`mb-6 p-4 ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'} rounded-2xl border backdrop-blur-sm transition-all duration-500 transform hover:scale-105`}>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <svg className="w-5 h-5 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                        Report Processing
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        Collection team notified • Awaiting confirmation
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleOpenModal}
                disabled={hasActiveReport}
                className="w-full group relative overflow-hidden py-4 px-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {hasActiveReport ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Report Submitted</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Report Now</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        
          {/* Collection Status Card */}
          <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/20' : 'bg-white/60'} backdrop-blur-xl rounded-3xl p-8 border ${isDarkMode ? 'border-gray-700/30' : 'border-white/30'} shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-700 ease-out ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} delay-200`}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-700"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <svg className="w-8 h-8 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12l4 5v6h-3a2 2 0 11-4 0H9a2 2 0 11-4 0H2v-6l4-5z" />
                      <circle cx="7" cy="17" r="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      <circle cx="17" cy="17" r="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                  </div>
                </div>
                <div className={`text-right transition-all duration-500 group-hover:translate-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-sm font-semibold tracking-wide">Collection Status</div>
                  <div className="text-xs opacity-70">Live Updates</div>
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-3 transition-all duration-500 group-hover:text-emerald-500 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeSchedule ? 'In Progress' : nextSchedule ? 'Scheduled' : recentCompletedSchedule ? 'Completed' : 'No Schedule'}
              </h3>
              
              {schedulesLoading ? (
                <div className="flex items-center space-x-3 py-6">
                  <div className="relative">
                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading schedule...</span>
                </div>
              ) : activeSchedule ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 rounded-2xl backdrop-blur-sm">
                    <div className="relative">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-50"></div>
                    </div>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      Collection in Progress
                    </span>
                  </div>
                  <div className="space-y-2 pl-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12l4 5v6h-3a2 2 0 11-4 0H9a2 2 0 11-4 0H2v-6l4-5z" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {activeSchedule.vehicle.make} {activeSchedule.vehicle.model}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Expected: {new Date(activeSchedule.estimatedCompletion).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : nextSchedule ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-500/10 rounded-2xl backdrop-blur-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Next Collection
                    </span>
                  </div>
                  <div className="space-y-2 pl-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(nextSchedule.scheduledStart).toLocaleDateString()} at {new Date(nextSchedule.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12l4 5v6h-3a2 2 0 11-4 0H9a2 2 0 11-4 0H2v-6l4-5z" />
                      </svg>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {nextSchedule.vehicle.make} {nextSchedule.vehicle.model}
                      </span>
                    </div>
                  </div>
                </div>
              ) : recentCompletedSchedule ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 rounded-2xl backdrop-blur-sm">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      Recently Completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 pl-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(recentCompletedSchedule.estimatedCompletion).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No scheduled collections
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Collections are scheduled based on community reports
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reports Summary Card */}
          <div className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-800/20' : 'bg-white/60'} backdrop-blur-xl rounded-3xl p-8 border ${isDarkMode ? 'border-gray-700/30' : 'border-white/30'} shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-700 ease-out ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} delay-300`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-700"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <svg className="w-8 h-8 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className={`text-right transition-all duration-500 group-hover:translate-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-sm font-semibold tracking-wide">Your Reports</div>
                  <div className="text-xs opacity-70">Activity Summary</div>
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-3 transition-all duration-500 group-hover:text-purple-500 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {reports.length} Total Reports
              </h3>
              <div className="space-y-3">
                {reports.filter(r => r.status === 'completed' || r.status === 'collected').length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {reports.filter(r => r.status === 'completed' || r.status === 'collected').length}
                      </span>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
                {reports.filter(r => r.status === 'in-progress').length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>In Progress</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        {reports.filter(r => r.status === 'in-progress').length}
                      </span>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                {reports.filter(r => r.status === 'new').length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {reports.filter(r => r.status === 'new').length}
                      </span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                )}
                {reports.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No reports yet
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Start by reporting when bins need attention
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Reports
              </h3>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📝</span>
        </div>
      </div>
        {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading reports...</span>
              </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
                {reports.slice(0, 3).map((report, index) => (
              <div
                key={report.id}
                    className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:shadow-md`}
              >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                          <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Bin Full Report
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          {new Date(report.timestamp).toLocaleDateString()} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {report.description && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {report.description}
                          </p>
                        )}
                  </div>
                  <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                      report.status === 'completed' || report.status === 'collected'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : report.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                        {report.status === 'collected' ? 'Collected' : 
                         report.status === 'completed' ? 'Completed' :
                         report.status === 'in-progress' ? 'In Progress' :
                         'New'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📝</span>
                </div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>No reports yet</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Start by reporting a bin full when needed
                </p>
              </div>
        )}
      </div>

          {/* Eco Tips */}
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-green-900/50 to-blue-900/50' : 'bg-gradient-to-br from-green-100/80 to-blue-100/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-green-800' : 'border-green-200'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Eco Tips
              </h3>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🌱</span>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: '♻️', title: 'Separate Materials', desc: 'Sort recyclable and non-recyclable waste' },
                { icon: '🧽', title: 'Clean Containers', desc: 'Rinse before recycling for better processing' },
                { icon: '📦', title: 'Flatten Boxes', desc: 'Save space and make transportation easier' },
                { icon: '🔍', title: 'Check Symbols', desc: 'Look for recycling symbols on packaging' }
              ].map((tip, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/30' : 'bg-white/40'} backdrop-blur-sm`}>
                  <span className="text-2xl">{tip.icon}</span>
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {tip.title}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tip.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Report Bin Full
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Zone
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  value={user?.zone || ''}
                  readOnly
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (optional)
                </label>
                <textarea
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="E.g., Bin is overflowing, extra bags left out"
                  rows={3}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className={`flex-1 py-3 px-4 border rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center space-x-2">
          <span className="text-lg">✅</span>
          <span className="font-medium">Report submitted successfully!</span>
        </div>
      )}
    </div>
  );
} 