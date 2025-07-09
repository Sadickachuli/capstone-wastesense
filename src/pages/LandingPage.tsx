import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const services = [
  {
    icon: '🏠',
    title: 'Resident Waste Reporting',
    description: 'One-click bin full reporting with real-time status updates and collection schedules.',
    features: ['Smart bin monitoring', 'Real-time notifications', 'Collection history']
  },
  {
    icon: '🚛',
    title: 'Smart Dispatch Management',
    description: 'AI-powered route optimization and fuel-efficient vehicle allocation system.',
    features: ['Route optimization', 'Fuel tracking', 'Fleet management']
  },
  {
    icon: '♻️',
    title: 'Recycling Analytics',
    description: 'Advanced waste composition analysis and recycling insights for facilities.',
    features: ['AI waste detection', 'Trend analysis', 'Forecasting']
  },
  {
    icon: '📊',
    title: 'Data-Driven Insights',
    description: 'Comprehensive analytics and reporting for municipal waste management.',
    features: ['Performance metrics', 'Cost analysis', 'Impact reports']
  }
];

const stats = [
  { number: '60%', label: 'Fuel Savings' },
  { number: '95%', label: 'AI Accuracy' },
  { number: '24/7', label: 'Real-time Updates' },
  { number: '3+', label: 'User Roles' }
];

const testimonials = [
  {
    name: 'Sarah Mensah',
    role: 'Resident, Ablekuma North',
    quote: 'WasteSense has made waste reporting so easy. I get notifications when my bin will be collected and can track the progress in real-time.',
    avatar: '👩🏾'
  },
  {
    name: 'Kwame Asante',
    role: 'Dispatch Manager, Accra Metropolitan',
    quote: 'The fuel-efficient routing has saved us 60% on operational costs. The AI waste detection is incredibly accurate.',
    avatar: '👨🏾'
  },
  {
    name: 'Dr. Ama Osei',
    role: 'Recycling Facility Manager',
    quote: 'The analytics dashboard gives us unprecedented insights into waste composition and helps us plan our operations better.',
    avatar: '👩🏾‍⚕️'
  }
];

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Detection',
    description: 'Advanced YOLO and LLM models for accurate waste composition analysis'
  },
  {
    icon: '⚡',
    title: 'Real-time Sync',
    description: 'Instant updates across all user dashboards with 30-second refresh cycles'
  },
  {
    icon: '📱',
    title: 'Mobile-First Design',
    description: 'Optimized for Ghana\'s mobile infrastructure with offline capabilities'
  },
  {
    icon: '🔋',
    title: 'Fuel Optimization',
    description: 'Smart algorithms reduce fuel consumption by up to 60%'
  },
  {
    icon: '🌍',
    title: 'Environmental Impact',
    description: 'Track and reduce carbon footprint with data-driven insights'
  },
  {
    icon: '🔒',
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with 99.9% uptime guarantee'
  }
];

export default function LandingPage() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🗂️</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                WasteSense
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Home</a>
              <a href="#services" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Services</a>
              <a href="#features" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Features</a>
              <a href="#about" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>About</a>
        </div>

        <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {isDarkMode ? '☀️' : '🌙'}
          </button>
              <Link
                to="/auth/signin"
                className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className={`py-20 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Your waste is our
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  opportunity
                </span>
              </h1>
              <p className={`text-xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Transform Ghana's waste management with AI-powered detection, fuel-efficient routing, 
                and real-time analytics. Join the smart waste revolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/auth/signup"
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-semibold text-center"
                >
                  Start Your Journey
                </Link>
                <button className={`px-8 py-4 border-2 border-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 font-semibold ${isDarkMode ? 'text-green-400 border-green-400' : 'text-green-600'}`}>
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/waste-bg3.jpg"
                  alt="Smart Waste Management"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Professional Waste Management Solutions
              </span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Comprehensive digital solutions for residents, dispatchers, and recycling facilities across Ghana
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className={`p-8 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-green-500'
                    : 'bg-white border-gray-200 hover:border-green-500 hover:shadow-green-100'
                }`}
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className={`text-sm flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Cutting-Edge Technology Features
              </span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Advanced AI and smart algorithms power every aspect of our waste management system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode ? 'bg-gray-900 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.description}
                </p>
          </div>
        ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-green-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                What Our Users Say
              </span>
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Real feedback from residents, dispatchers, and recycling facilities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`p-8 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className={`italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gradient-to-r from-green-900 to-blue-900' : 'bg-gradient-to-r from-green-600 to-blue-600'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Waste Management?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join the smart waste revolution today and experience the future of sustainable waste management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold"
            >
              Get Started Free
            </Link>
            <Link
              to="/auth/signin"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-green-600 transition-all duration-200 font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${isDarkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-50 border-t border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🗂️</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  WasteSense
                </span>
              </div>
              <p className={`mb-4 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Smart waste management system designed specifically for Ghana's urban waste challenges, 
                connecting residents, dispatchers, and recyclers through an integrated platform.
              </p>
              <div className="flex space-x-4">
                <a href="#" className={`text-2xl hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>📧</a>
                <a href="#" className={`text-2xl hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>📱</a>
                <a href="#" className={`text-2xl hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>🌐</a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#home" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Home</a></li>
                <li><a href="#services" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Services</a></li>
                <li><a href="#features" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Features</a></li>
                <li><a href="#about" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>About</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Help Center</a></li>
                <li><a href="#" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contact Us</a></li>
                <li><a href="#" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Privacy Policy</a></li>
                <li><a href="#" className={`hover:text-green-600 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`mt-8 pt-8 border-t text-center ${isDarkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
            <p>&copy; {new Date().getFullYear()} WasteSense. All rights reserved. Built with ❤️ for sustainable waste management in Ghana.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 