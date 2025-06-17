import React from 'react';
import { Link } from 'react-router-dom';

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-extrabold text-green-700">WasteSense</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/auth/signup" className="px-5 py-2 rounded-full bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition">Sign Up</Link>
          <Link to="/auth/signin" className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">Sign In</Link>
        </div>
      </nav>
      {/* Hero Section */}
      <header className="flex flex-col md:flex-row items-center justify-between px-8 py-12 bg-gradient-to-br from-green-100 to-blue-50 rounded-b-3xl shadow-lg mb-8">
        <div className="flex-1 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-800 mb-4">Stay Up to Date with Waste Collection</h1>
          <p className="text-xl text-blue-900 mb-6">Receive notifications, view schedules, and help keep your community clean and green.</p>
          <Link to="/auth/signup" className="inline-block px-8 py-3 rounded-full bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition">Get Started</Link>
        </div>
        <div className="flex-1 flex justify-center">
          <img src="/waste-hero-illustration.svg" alt="Waste management illustration" className="w-80 h-80 object-contain" />
        </div>
      </header>
      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
            <span className="text-5xl mb-3">{f.icon}</span>
            <h3 className="text-lg font-bold text-green-800 mb-2">{f.title}</h3>
            <p className="text-gray-600 text-center">{f.desc}</p>
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
            <div key={i} className="bg-white rounded-xl shadow p-4 cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-800">{faq.q}</span>
                <span className="text-xl">{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && <p className="mt-2 text-gray-700 text-left">{faq.a}</p>}
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