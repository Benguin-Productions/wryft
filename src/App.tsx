import { Search, Mail, Lock, X } from 'lucide-react';
import loginImg from './login.png';
import signupImg from './signup.png';
import { useState } from 'react';
import wryftLogo from './wryft.png';

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [view, setView] = useState<'home' | 'create' | 'login'>('home');

  if (view === 'create') {
    return (
      <div className="h-screen overflow-hidden bg-[#0a0a0a] text-white font-inter font-semibold">
        <div className="w-full px-8 py-12 relative h-full">
          {/* Full-height center divider */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gray-700" />
          {/* Back button */}
          <button
            onClick={() => setView('home')}
            aria-label="Close"
            className="absolute top-6 left-6 h-14 w-14 rounded-3xl bg-black/80 hover:bg-black/70 transition-colors flex items-center justify-center z-20 shadow-inner ring-1 ring-black/30"
          >
            <X className="w-8 h-8 text-purple-500" strokeWidth={3} />
          </button>
          <div className="grid grid-cols-[1fr_1px_1fr] gap-12 h-full items-center relative z-10">
            {/* Left headline */}
            <div className="flex justify-center">
              <div className="text-center">
                <img src={signupImg} alt="Create Account" className="h-26 w-auto inline-block" />
                <p className="text-gray-400 mt-2"></p>
              </div>
            </div>

            {/* Spacer column to align with divider */}
            <div />

            {/* Right form */}
            <div className="pr-8">
              <div className="mt-6">
                <p className="text-xs text-gray-400">Step 1 of 3</p>
                <h2 className="text-2xl font-semibold mt-1">Welcome to wryft!🌵</h2>
                <p className="text-sm text-gray-400 mt-1 leading-6">Wryft is a social platform for people to show of their creation,<br/>and get feedback</p>
              </div>
              <form className="mt-12 space-y-6 max-w-md">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">@</span>
                    <input
                      type="text"
                      placeholder="Username"
                      className="w-full bg-[#121212] border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      placeholder="Username"
                      className="w-full bg-[#121212] border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="h-screen overflow-hidden bg-[#0a0a0a] text-white font-inter font-semibold">
        <div className="w-full px-8 py-12 relative h-full">
          {/* Full-height center divider */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gray-700" />
          {/* Back button */}
          <button
            onClick={() => setView('home')}
            aria-label="Close"
            className="absolute top-6 left-6 h-14 w-14 rounded-3xl bg-black/80 hover:bg-black/70 transition-colors flex items-center justify-center z-20 shadow-inner ring-1 ring-black/30"
          >
            <X className="w-8 h-8 text-purple-500" strokeWidth={3} />
          </button>
          <div className="grid grid-cols-[1fr_1px_1fr] gap-12 h-full items-center relative z-10">
            {/* Left headline */}
            <div className="flex justify-center">
              <div className="text-center">
                <img src={loginImg} alt="Login" className="h-30 w-auto inline-block" />
                <p className="text-gray-400 mt-2"></p>
              </div>
            </div>

            {/* Spacer column to align with divider */}
            <div />

            {/* Right form */}
            <div className="pr-8">
              <div className="mt-6">
                <p className="text-xs text-gray-400">Step 1 of 1</p>
                <h2 className="text-2xl font-semibold mt-1">Welcome back to wryft!🌵</h2>
                <p className="text-sm text-gray-400 mt-1 leading-6">Enter your credentials to continue.</p>
              </div>
              <form className="mt-12 space-y-6 max-w-md">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full bg-[#121212] border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full bg-[#121212] border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-gray-700 min-h-screen p-8 translate-x-[400px]">
          {/* Logo */}
          <div className="mb-0">
            <img src={wryftLogo} alt="Wryft" className="h-24 w-auto relative top-0.5" />
          </div>
          {/* Call to Action */}
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold leading-tight text-white mb-4">
              Join the
              <br />
              developers
            </h2>
            <div className="flex gap-2 mb-4">
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors" onClick={() => setView('create')}>
                Create account
              </button>
              <button className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors" onClick={() => setView('login')}>
                Sign in
              </button>
            </div>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-[400px]">
          {/* Content Area */}
          <div className="p-8">
            {/* Top Navigation (inside middle content) */}
            <div className="border-b border-gray-700">
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'discover'
                      ? 'border-purple-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab('feeds')}
                  className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'feeds'
                      ? 'border-purple-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Feeds
                </button>
              </div>
            </div>

            {/* Feed placeholder — keep divider spacing to preserve the design */}
            <div className="mt-8 divide-y divide-gray-800" />
          </div>
        </div>

        {/* Right Sidebar - Search */}
        <div className="w-80 border-l border-gray-700 p-6 -translate-x-[400px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-[#121212] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
