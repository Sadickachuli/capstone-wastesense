import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const services = [
  {
    icon: (
      <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
      </svg>
    ),
    title: 'Resident Waste Reporting',
    description: 'One-click bin full reporting with real-time status updates and collection schedules.',
    features: ['Smart bin monitoring', 'Real-time notifications', 'Collection history']
  },
  {
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12l4 5v6h-3a2 2 0 11-4 0H9a2 2 0 11-4 0H2v-6l4-5z" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
    title: 'Smart Dispatch Management',
    description: 'AI-powered route optimization and fuel-efficient vehicle allocation system.',
    features: ['Route optimization', 'Fuel tracking', 'Fleet management']
  },
  {
    icon: (
      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Recycling Analytics',
    description: 'Advanced waste composition analysis and recycling insights for facilities.',
    features: ['AI waste detection', 'Trend analysis', 'Forecasting']
  },
  {
    icon: (
      <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Data-Driven Insights',
    description: 'Comprehensive analytics and reporting for municipal waste management.',
    features: ['Performance metrics', 'Cost analysis', 'Impact reports']
  }
];

const stats = [
  { number: 95, label: 'AI Accuracy', suffix: '%' },
  { number: 24, label: 'Real-time Updates', suffix: '/7' },
  { number: 3, label: 'User Roles', suffix: '+' }
];

const testimonials = [
  {
    name: 'Sarah Mensah',
    role: 'Resident, Ablekuma North',
    quote: 'WasteSense has made waste reporting so easy. I get notifications when my bin will be collected and can track the progress in real-time.',
    avatar: (
      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    ),
    rating: 5
  },
  {
    name: 'Kwame Asante',
    role: 'Dispatch Manager, Accra Metropolitan',
    quote: 'The fuel-efficient routing has saved us significant operational costs. The AI waste detection is incredibly accurate.',
    avatar: (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    ),
    rating: 5
  },
  {
    name: 'Dr. Ama Osei',
    role: 'Recycling Facility Manager',
    quote: 'The analytics dashboard gives us unprecedented insights into waste composition and helps us plan our operations better.',
    avatar: (
      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    ),
    rating: 5
  },
  {
    name: 'John Doe',
    role: 'Environmental Coordinator',
    quote: 'The platform has revolutionized how we handle environmental compliance and waste tracking across our facilities.',
    avatar: (
      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    ),
    rating: 5
  }
];

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-Powered Detection',
    description: 'Advanced YOLO and LLM models for accurate waste composition analysis'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Real-time Sync',
    description: 'Instant updates across all user dashboards with 30-second refresh cycles'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Web-Based Platform',
    description: 'Accessible from any device with internet connection - desktop, tablet, or mobile'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
    title: 'Fuel Optimization',
    description: 'Smart algorithms reduce fuel consumption for waste collection trucks'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Environmental Impact',
    description: 'Track and reduce carbon footprint with data-driven insights'
  },
  {
    icon: (
      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with 99.9% uptime guarantee'
  }
];

// Animation hook
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isIntersecting] as const;
};

// Counter animation hook
const useCountingAnimation = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animateCount = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isVisible, end, duration]);

  return [count, setIsVisible] as const;
};

// Typing animation hook
const useTypingAnimation = (text: string, speed: number = 100) => {
  const [displayText, setDisplayText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let index = 0;
    const timer = setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index++;
      if (index === text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [isVisible, text, speed]);

  return [displayText, setIsVisible] as const;
};

export default function LandingPage() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Animation refs
  const [heroRef, heroInView] = useIntersectionObserver({ threshold: 0.1 });
  const [statsRef, statsInView] = useIntersectionObserver({ threshold: 0.3 });
  const [servicesRef, servicesInView] = useIntersectionObserver({ threshold: 0.1 });
  const [featuresRef, featuresInView] = useIntersectionObserver({ threshold: 0.1 });
  
  // Typing animation for main heading
  const [typingText, setTypingVisible] = useTypingAnimation('Professional Waste Management Solutions', 50);
  
  // Counter animations for stats (updated for new stats array)
  const [count1, setCount1Visible] = useCountingAnimation(stats[0].number);
  const [count2, setCount2Visible] = useCountingAnimation(stats[1].number);
  const [count3, setCount3Visible] = useCountingAnimation(stats[2].number);
  
  const countAnimations = [
    { count: count1, setVisible: setCount1Visible },
    { count: count2, setVisible: setCount2Visible },
    { count: count3, setVisible: setCount3Visible }
  ];
  
  // Trigger animations when sections come into view
  useEffect(() => {
    if (heroInView) setTypingVisible(true);
  }, [heroInView]);
  
  useEffect(() => {
    if (statsInView) {
      countAnimations.forEach(({ setVisible }) => setVisible(true));
    }
  }, [statsInView]);

  return (
    <div className={`min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Enhanced Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-b shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2m0 0V5a2 2 0 012-2h14a2 2 0 012 2v4M5 11a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                WasteSense
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className={`relative group font-medium hover:text-emerald-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#services" className={`relative group font-medium hover:text-emerald-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#features" className={`relative group font-medium hover:text-emerald-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#testimonials" className={`relative group font-medium hover:text-emerald-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
        </div>

        <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`relative p-3 rounded-xl transition-all duration-300 group ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <div className="relative">
                  {isDarkMode ? (
                    <svg className="w-5 h-5 text-yellow-500 transform group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-700 transform group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </div>
          </button>
              <Link
                to="/auth/signin"
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-slate-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="group relative overflow-hidden px-8 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section ref={heroRef} id="home" className={`relative pt-32 pb-32 overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950' : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50'}`}>
        {/* Animated Background Pattern - Fixed for light mode */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-emerald-500' : 'bg-slate-600'}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className={`space-y-8 ${heroInView ? 'animate-slideInLeft' : 'opacity-0'}`}>
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 pb-2" style={{ lineHeight: '1.2' }}>
                  <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Your waste is our
                  </span>
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    opportunity
                  </span>
                </h1>
                <div className="h-2 w-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"></div>
              </div>
              <p className={`text-xl md:text-2xl leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Transform Ghana's waste management with{' '}
                <span className="font-semibold text-emerald-600">AI-powered detection</span>,{' '}
                <span className="font-semibold text-blue-600">fuel-efficient routing</span>, and{' '}
                <span className="font-semibold text-purple-600">real-time analytics</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  to="/auth/signup"
                  className="group relative overflow-hidden px-10 py-5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-2">
                    <span>Start Your Journey</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <button className={`group px-10 py-5 border-2 border-emerald-600 rounded-2xl font-semibold text-lg hover:bg-emerald-600 hover:text-white transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${isDarkMode ? 'text-emerald-400 hover:border-emerald-500' : 'text-emerald-600'}`}>
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Watch Demo</span>
                  </span>
                </button>
              </div>
            </div>
            <div className={`relative ${heroInView ? 'animate-slideInRight' : 'opacity-0'}`}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-700"></div>
                <div className="relative">
                  <img
                    src="/wastebg1.jpg"
                    alt="Smart Waste Management"
                    className="w-full h-auto rounded-3xl shadow-2xl transform group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent rounded-3xl"></div>
                </div>
              </div>
              
              {/* Floating Feature Cards - Fixed positioning to avoid navbar overlap */}
              <div className="absolute top-4 -left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl animate-float z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">AI Detection</p>
                    <p className="text-sm text-gray-600">95% Accuracy</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl animate-float-delayed z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Fuel Saving</p>
                    <p className="text-sm text-gray-600">For Waste Trucks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section with Counting Animation */}
      <section ref={statsRef} className={`py-24 ${isDarkMode ? 'bg-gradient-to-r from-gray-900 to-slate-900' : 'bg-gradient-to-r from-yellow-50 to-orange-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Proven Results
              </span>
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Real metrics from our waste management platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden text-center p-8 rounded-2xl transition-all duration-700 hover:scale-105 hover:shadow-2xl ${
                  isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700' : 'bg-white/80 hover:bg-white shadow-lg'
                } ${statsInView ? 'animate-slideInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative">
                  <div className="text-4xl md:text-5xl font-bold mb-3">
                    <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      {countAnimations[index].count}
                      {stat.suffix}
                    </span>
                  </div>
                  <div className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stat.label}
                  </div>
                  
                  {/* Animated progress bar */}
                  <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-2000 ease-out"
                      style={{
                        width: statsInView ? `${(countAnimations[index].count / stat.number) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                </div>
          </div>
        ))}
          </div>
        </div>
      </section>

      {/* Enhanced Services Section with Typing Animation */}
      <section ref={servicesRef} id="services" className={`py-24 ${isDarkMode ? 'bg-gradient-to-br from-emerald-900 to-slate-900' : 'bg-gradient-to-br from-green-50 to-teal-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {typingText}
                <span className="animate-pulse">|</span>
              </span>
            </h2>
            <p className={`text-xl max-w-4xl mx-auto leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Comprehensive digital solutions for residents, dispatchers, and recycling facilities across Ghana
            </p>
            <div className="mt-8 flex justify-center">
              <div className="h-1 w-32 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden p-10 rounded-3xl border transition-all duration-700 hover:scale-105 hover:shadow-2xl ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-slate-700 hover:border-emerald-500 hover:bg-slate-700/70'
                    : 'bg-white/80 border-gray-200 hover:border-emerald-500 hover:shadow-emerald-100 backdrop-blur-sm'
                } ${servicesInView ? 'animate-slideInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="relative">
                  <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    {service.icon}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {service.title}
                  </h3>
                  
                  <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {service.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className={`text-sm flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Hover effect arrow */}
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section ref={featuresRef} id="features" className={`py-24 ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-blue-900' : 'bg-gradient-to-br from-indigo-50 to-cyan-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Cutting-Edge Technology Features
              </span>
            </h2>
            <p className={`text-xl max-w-4xl mx-auto leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Advanced AI and smart algorithms power every aspect of our waste management system
            </p>
            <div className="mt-8 flex justify-center">
              <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden p-8 rounded-2xl transition-all duration-700 hover:scale-105 hover:shadow-2xl ${
                  isDarkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-white/80 hover:bg-white shadow-lg backdrop-blur-sm'
                } ${featuresInView ? 'animate-slideInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="relative">
                  <div className="mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    {feature.icon}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  
                  <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                  
                  {/* Animated border bottom */}
                  <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 group-hover:w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section - Horizontal Scrolling */}
      <section id="testimonials" className={`py-24 ${isDarkMode ? 'bg-gradient-to-br from-purple-900 to-slate-900' : 'bg-gradient-to-br from-rose-50 to-pink-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                What Our Users Say
              </span>
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Real feedback from residents, dispatchers, and recycling facilities
            </p>
            <div className="mt-8 flex justify-center">
              <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
          </div>

          {/* Horizontal Scrolling Testimonials Banner */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll-left space-x-8 pb-8">
              {/* Duplicate testimonials for seamless loop */}
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 w-80 group relative overflow-hidden p-8 rounded-3xl border transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                    isDarkMode
                      ? 'bg-slate-800/70 border-slate-700 hover:border-purple-500'
                      : 'bg-white/90 border-gray-200 shadow-lg hover:shadow-purple-100 backdrop-blur-sm'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative">
                    {/* Star Rating */}
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <div className="mb-6">
                      <svg className="w-8 h-8 text-purple-500 mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                      </svg>
                      <p className={`text-lg italic leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        "{testimonial.quote}"
                      </p>
                    </div>
                    
                    {/* Author Info */}
                    <div className="flex items-center">
                      <div className="mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {testimonial.name}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
              ))}
            </div>
            
            {/* Gradient overlays for fade effect */}
            <div className={`absolute top-0 left-0 w-20 h-full bg-gradient-to-r ${isDarkMode ? 'from-purple-900 to-transparent' : 'from-rose-50 to-transparent'} z-10`}></div>
            <div className={`absolute top-0 right-0 w-20 h-full bg-gradient-to-l ${isDarkMode ? 'from-slate-900 to-transparent' : 'from-pink-50 to-transparent'} z-10`}></div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with Dynamic Background */}
      <section className="relative py-32 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700 animate-gradient-xy"></div>
        
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Moving gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              <span className="block">Ready to Transform</span>
              <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                Waste Management?
              </span>
            </h2>
            
            <div className="h-2 w-32 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mx-auto"></div>
            
            <p className="text-xl md:text-2xl text-emerald-100 leading-relaxed max-w-3xl mx-auto">
              Join the smart waste revolution today and experience the future of 
              <span className="font-semibold text-yellow-300"> sustainable waste management</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Link
                to="/auth/signup"
                className="group relative overflow-hidden px-10 py-5 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Get Started Free</span>
                </span>
              </Link>
              
              <Link
                to="/auth/signin"
                className="group px-10 py-5 border-2 border-white text-white rounded-2xl font-bold text-lg hover:bg-white hover:text-emerald-600 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-1 backdrop-blur-sm"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className={`py-16 ${isDarkMode ? 'bg-gradient-to-r from-slate-900 to-gray-900 border-t border-slate-800' : 'bg-gradient-to-r from-white to-gray-50 border-t border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6 group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2m0 0V5a2 2 0 012-2h14a2 2 0 012 2v4M5 11a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z" />
                    </svg>
                  </div>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  WasteSense
                </span>
              </div>
              <p className={`mb-6 max-w-lg leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Smart waste management system designed specifically for Ghana's urban waste challenges, 
                connecting residents, dispatchers, and recyclers through an integrated platform.
              </p>
              <div className="flex space-x-6">
                <a href="#" className={`group p-3 rounded-xl transition-all duration-300 hover:scale-110 ${isDarkMode ? 'text-gray-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <a href="#" className={`group p-3 rounded-xl transition-all duration-300 hover:scale-110 ${isDarkMode ? 'text-gray-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
                <a href="#" className={`group p-3 rounded-xl transition-all duration-300 hover:scale-110 ${isDarkMode ? 'text-gray-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className={`font-bold mb-6 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Links
              </h3>
              <ul className="space-y-4">
                <li>
                  <a href="#home" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Home
                  </a>
                </li>
                <li>
                  <a href="#services" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Services
                  </a>
                </li>
                <li>
                  <a href="#features" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className={`font-bold mb-6 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Support
              </h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className={`transition-all duration-300 hover:text-emerald-600 hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className={`mt-12 pt-8 border-t text-center ${isDarkMode ? 'border-slate-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
            <p className="flex items-center justify-center space-x-2">
              <span>&copy; {new Date().getFullYear()} WasteSense. All rights reserved.</span>
              <span className="text-emerald-600">•</span>
              <span>Built for sustainable waste management in Ghana.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 