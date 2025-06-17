import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const features = [
  {
    icon: '📅',
    title: 'Collection Schedule',
    desc: 'Browse the up-to-date waste collection schedule and important dates for your area.'
  },
  {
    icon: '🔔',
    title: 'Push Notifications',
    desc: 'Get notified about upcoming waste pickups and important community alerts.'
  },
  {
    icon: '📢',
    title: 'Local Announcements',
    desc: 'Post or view local ads for reusable items and community news.'
  },
  {
    icon: '🎓',
    title: 'Education',
    desc: 'Learn how to properly sort and dispose of waste to help the environment.'
  },
  {
    icon: '💳',
    title: 'Payments',
    desc: 'Stay informed about upcoming waste collection payments and deadlines.'
  },
  {
    icon: '📷',
    title: 'Issue Reporting',
    desc: 'Report issues or illegal dumping with photos directly to the authorities.'
  },
];

const faqs = [
  {
    q: 'How quickly can the app be deployed?',
    a: 'The app can be deployed within 7 days after agreement. Your municipality just needs to provide the waste collection schedule.'
  },
  {
    q: 'Can we disable certain modules?',
    a: 'Yes, you can choose which modules are active for your community. The app can be customized to your needs.'
  },
  {
    q: 'Is the app accessible for visually impaired users?',
    a: 'A high-contrast version is coming soon to make the app accessible for everyone.'
  },
  {
    q: 'Is the app free?',
    a: 'The app is free for residents. Municipalities subscribe to provide digital schedules and features.'
  },
  {
    q: 'Is my data safe?',
    a: 'Yes, the app meets high security standards and does not track your location.'
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  return (
    <div className={"min-h-screen flex flex-col " + (isDarkMode ? "bg-gradient-to-br from-green-900 to-blue-900" : "bg-gradient-to-br from-green-50 to-blue-100") }>
      {/* Navbar */}
      <nav className={"flex items-center justify-between px-6 py-4 sticky top-0 z-10 " + (isDarkMode ? "bg-gray-900/80" : "bg-white/80 shadow-sm") }>
        <div className="flex items-center space-x-2">
          <span className={"text-2xl font-extrabold " + (isDarkMode ? "text-green-300" : "text-green-700")}>WasteSense</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleDarkMode} className="px-3 py-2 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold shadow hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200">
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <Link to="/auth/signup" className="px-6 py-2 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold shadow-md hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200">Sign Up</Link>
          <Link to="/auth/signin" className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold shadow-md hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200">Sign In</Link>
        </div>
      </nav>
      {/* Hero Section */}
      <header className="flex flex-col md:flex-row items-center justify-between px-8 py-12 bg-gradient-to-br from-green-100 to-blue-50 rounded-b-3xl shadow-lg mb-8">
        <div className="flex-1 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-800 mb-4">Stay Up to Date with Waste Collection</h1>
          <p className="text-xl text-blue-900 mb-6">Receive notifications, view schedules, and help keep your community clean and green.</p>
          <Link to="/auth/signup" className="inline-block px-10 py-3 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-extrabold text-lg shadow-xl hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200">Get Started</Link>
        </div>
        <div className="flex-1 flex justify-center">
          <img src="/waste-bg3.jpg" alt="Waste management illustration" className="w-80 h-80 object-contain" />
        </div>
      </header>
      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 group">
            <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">{f.icon}</span>
            <h3 className="text-xl font-bold text-green-800 mb-2">{f.title}</h3>
            <p className="text-gray-600 text-center text-base">{f.desc}</p>
          </div>
        ))}
      </section>
      {/* Benefits/Impact Section */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">Empowering Residents, Boosting Recycling</h2>
        <p className="text-lg text-gray-700 mb-4">The app educates residents on proper waste sorting and disposal, and helps municipalities increase annual recycling rates. Make a real impact in your community!</p>
      </section>
      {/* Integration Section */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-center bg-white rounded-2xl shadow-lg mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-4">Seamless Integration with Collection Points</h2>
        <p className="text-lg text-gray-700 mb-2">With e-card integration, residents can quickly identify themselves at collection points and avoid paperwork. It's convenient for both residents and staff!</p>
      </section>
      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 py-8 mb-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-800 text-base">{faq.q}</span>
                <span className="text-xl">{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && <p className="mt-2 text-gray-700 text-left text-base">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>
      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm bg-white/80 mt-auto">
        &copy; {new Date().getFullYear()} WasteSense. All rights reserved.
      </footer>
    </div>
  );
} 