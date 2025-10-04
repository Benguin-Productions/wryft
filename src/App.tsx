import { Search, Mail, Lock, X, Home, Bell, MessageCircle, User, Settings, SquarePen, MoreHorizontal } from 'lucide-react';
import { apiMe, apiRegister, apiLogin, apiCreatePost, apiListPosts, apiGetUser, apiGetUserPosts } from './api';
import { useEffect, useState, useCallback } from 'react';
import loginImg from './login.png';
import signupImg from './signup.png';
import wryftLogo from './wryft.png';
import defaultPfp from './default_pfp.png';
import verifiedIcon from './verified.png';

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [view, setView] = useState<'home' | 'create' | 'login' | 'profile'>('home');
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; username: string; email: string; discriminator?: number } | null>(null);
  // Create form state
  const [cUsername, setCUsername] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cInvite, setCInvite] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState<string | null>(null);
  // Login form state
  const [lEmail, setLEmail] = useState('');
  const [lPassword, setLPassword] = useState('');
  const [lLoading, setLLoading] = useState(false);
  const [lError, setLError] = useState<string | null>(null);
  // New Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postText, setPostText] = useState('');
  // Splash screen
  const [showSplash, setShowSplash] = useState(true);
  // Feed state
  const [posts, setPosts] = useState<Array<{ id: string; content: string; createdAt: string; author: { id: string; username: string; discriminator?: number } }>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedLoaded, setFeedLoaded] = useState(false);

  // Profile state
  const [profileUser, setProfileUser] = useState<null | { id: string; username: string; discriminator?: number; bio?: string; createdAt: string }>(null);
  const [profilePosts, setProfilePosts] = useState<Array<{ id: string; content: string; createdAt: string; author: { id: string; username: string; discriminator?: number } }>>([]);
  const [profileNext, setProfileNext] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      setFeedError(null);
      setLoadingFeed(true);
      const data = await apiListPosts({ limit: 20 });
      console.log('Feed items (fetchFeed)', data.items?.length ?? 0);
      setPosts(data.items || []);
      setNextCursor(data.nextCursor || null);
      setFeedLoaded(true);
    } catch (e: any) {
      console.error('Feed load failed', e);
      setFeedError(e?.message || 'Failed to load posts');
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Load my profile when switching to profile view
  useEffect(() => {
    async function loadProfile(u: string) {
      try {
        setProfileError(null);
        setProfileLoading(true);
        const user = await apiGetUser(u);
        setProfileUser(user);
        const data = await apiGetUserPosts({ username: u, limit: 20 });
        setProfilePosts(data.items || []);
        setProfileNext(data.nextCursor || null);
      } catch (e: any) {
        setProfileError(e?.message || 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    }
    if (view === 'profile') {
      const uname = me?.username;
      if (uname) loadProfile(uname);
    }
  }, [view, me]);

  // Hide splash after 2s
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Restore session on reload
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      setToken(t);
      apiMe(t).then(setMe).catch(() => setMe(null));
    }
  }, []);

  // Close modal on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowPostModal(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const signOut = () => {
    localStorage.removeItem('token');
    setToken(null);
    setMe(null);
  };

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCError(null);
    if (!cUsername || !cEmail || !cPassword || !cInvite) {
      setCError('All fields are required');
      return;
    }
    try {
      setCLoading(true);
      const res = await apiRegister({ username: cUsername, email: cEmail, password: cPassword, inviteCode: cInvite });
      const t = res.token as string;
      localStorage.setItem('token', t);
      setToken(t);
      const who = await apiMe(t);
      setMe(who);
      setView('home');
    } catch (err: any) {
      setCError(err.message || 'Failed to create account');
    } finally {
      setCLoading(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLError(null);
    if (!lEmail || !lPassword) {
      setLError('Email and password are required');
      return;
    }
    try {
      setLLoading(true);
      const res = await apiLogin({ email: lEmail, password: lPassword });
      const t = res.token as string;
      localStorage.setItem('token', t);
      setToken(t);
      const who = await apiMe(t);
      setMe(who);
      setView('home');
    } catch (err: any) {
      setLError(err.message || 'Failed to sign in');
    } finally {
      setLLoading(false);
    }
  }

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
              <form className="mt-12 space-y-6 max-w-md" onSubmit={handleCreateSubmit}>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">@</span>
                    <input
                      type="text"
                      placeholder="Username"
                      value={cUsername}
                      onChange={(e) => setCUsername(e.target.value)}
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
                      placeholder="Email"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
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
                      value={cPassword}
                      onChange={(e) => setCPassword(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Invite code</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter invite code"
                      value={cInvite}
                      onChange={(e) => setCInvite(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
                    />
                  </div>
                </div>
                {cError && <p className="text-xs text-red-400">{cError}</p>}
                <div className="pt-2">
                  <button type="submit" disabled={cLoading} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-lg py-2 text-sm font-medium transition-colors">
                    {cLoading ? 'Creating…' : 'Create account'}
                  </button>
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
              <form className="mt-12 space-y-6 max-w-md" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={lEmail}
                      onChange={(e) => setLEmail(e.target.value)}
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
                      value={lPassword}
                      onChange={(e) => setLPassword(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700"
                    />
                  </div>
                </div>
                {lError && <p className="text-xs text-red-400">{lError}</p>}
                <div className="pt-2">
                  <button type="submit" disabled={lLoading} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-lg py-2 text-sm font-medium transition-colors">
                    {lLoading ? 'Signing in…' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-700 min-h-screen p-8 translate-x-[380px]">
          {/* Logo */}
          <div className="mb-0">
            <img src={wryftLogo} alt="Wryft" className="h-24 w-auto relative top-0.5" />
          </div>
          {/* CTA (logged out) or Nav (logged in) */}
          {!token ? (
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
          ) : (
            <div className="mb-6">
              <nav className="space-y-4 text-lg">
                <button
                  className={`flex items-center gap-4 py-2 ${view === 'home' ? 'text-white' : 'text-gray-300 hover:text-white transition-colors'}`}
                  onClick={() => {
                    setView('home');
                    setActiveTab('discover');
                  }}
                >
                  <Home className="w-6 h-6" />
                  <span className="font-semibold">Home</span>
                </button>
                <button className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors py-2">
                  <Search className="w-6 h-6" />
                  <span>Explore</span>
                </button>
                <button className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors py-2">
                  <Bell className="w-6 h-6" />
                  <span>Notifications</span>
                </button>
                <button className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors py-2">
                  <MessageCircle className="w-6 h-6" />
                  <span>Chat</span>
                </button>
                
                <button
                  className={`flex items-center gap-4 py-2 ${view === 'profile' ? 'text-white' : 'text-gray-300 hover:text-white transition-colors'}`}
                  onClick={() => setView('profile')}
                >
                  <User className="w-6 h-6" />
                  <span>Profile</span>
                </button>
                <button className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors py-2">
                  <Settings className="w-6 h-6" />
                  <span>Settings</span>
                </button>
              </nav>
              <button onClick={() => setShowPostModal(true)} className="mt-5 w-full flex items-center justify-center gap-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 text-[17px] font-semibold transition-colors" type="button" aria-label="Create new post">
                <SquarePen className="w-6 h-6" />
                New Post
              </button>
            </div>
          )}

          {/* Profile Card (signed in) */}
          {token && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  <img src={defaultPfp} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                  <div className="leading-tight">
                    <div className="text-white font-semibold flex items-center gap-1">
                      <span>{me?.username || 'User'}</span>
                      {me?.username === 'benguin' && typeof me?.discriminator === 'number' && me.discriminator === 1 && (
                        <img src={verifiedIcon} alt="Verified" className="h-4 w-4 inline-block align-text-top" />
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {me ? `@${me.username}${typeof me.discriminator === 'number' ? `#${String(me.discriminator).padStart(4, '0')}` : ''}` : ''}
                    </div>
                  </div>
                </div>
                {/* Menu */}
                <button className="text-gray-400 hover:text-white transition-colors" aria-label="Profile menu">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              {/* Optional small sign out under card */}
              <button
                onClick={signOut}
                className="mt-3 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-[380px] h-screen overflow-y-auto no-scrollbar">
          {/* Content Area */}
          <div className="p-8 px-3">
            {view === 'profile' ? (
              <div>
                {/* Profile Header */}
                <div className="pb-6 border-b border-gray-800">
                  <div className="flex items-center gap-4">
                    <img src={defaultPfp} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
                    <div>
                      <div className="text-xl font-semibold text-white flex items-center gap-2">
                        <span>{profileUser?.username || me?.username}</span>
                        {((profileUser?.username === 'benguin' && profileUser?.discriminator === 1) || (profileUser == null && me?.username === 'benguin' && me?.discriminator === 1)) && (
                          <img src={verifiedIcon} alt="Verified" className="h-5 w-5 inline-block align-text-top" />
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">@
                        {(profileUser?.username || me?.username) || 'user'}
                        {typeof (profileUser?.discriminator ?? me?.discriminator) === 'number' ? `#${String(profileUser?.discriminator ?? me?.discriminator).padStart(4,'0')}` : ''}
                      </div>
                      {profileUser?.bio && (
                        <div className="text-gray-300 text-sm mt-1 whitespace-pre-wrap">{profileUser.bio}</div>
                      )}
                      {profileUser?.createdAt && (
                        <div className="text-gray-500 text-xs mt-1">Joined {new Date(profileUser.createdAt).toLocaleString(undefined, { month: 'short', year: 'numeric' })}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Posts */}
                <div className="mt-6 divide-y divide-gray-800">
                  {profileError && (
                    <div className="mb-4 rounded-md border border-red-900/40 bg-red-950/40 text-red-300 text-xs px-3 py-2">{profileError}</div>
                  )}
                  {profileLoading && profilePosts.length === 0 && (
                    <div className="py-8 text-sm text-gray-400">Loading posts…</div>
                  )}
                  {profilePosts.map((p) => (
                    <div key={p.id} className="py-5 flex gap-4">
                      <img src={defaultPfp} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-white flex items-center gap-1">
                        <span>{p.author.username}</span>
                        {p.author.username === 'benguin' && typeof p.author.discriminator === 'number' && p.author.discriminator === 1 && (
                          <img src={verifiedIcon} alt="Verified" className="h-4 w-4 inline-block align-text-top" />
                        )}
                      </span>
                          <span className="text-gray-500">@{p.author.username}{typeof p.author.discriminator === 'number' ? `#${String(p.author.discriminator).padStart(4, '0')}` : ''}</span>
                          <span className="text-gray-600">• {new Date(p.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-[15px] leading-6 text-gray-200 whitespace-pre-wrap">{p.content}</div>
                      </div>
                    </div>
                  ))}
                  {!profileLoading && profilePosts.length === 0 && (
                    <div className="py-8 text-sm text-gray-400">No posts yet.</div>
                  )}
                  {profileNext && (
                    <div className="py-6">
                      <button
                        className="px-4 py-2 text-sm rounded-md bg-black/50 border border-gray-800 hover:border-gray-700"
                        onClick={async () => {
                          try {
                            setProfileError(null);
                            setProfileLoading(true);
                            const data = await apiGetUserPosts({ username: profileUser?.username || me?.username!, limit: 20, cursor: profileNext || undefined });
                            setProfilePosts((prev) => [...prev, ...(data.items || [])]);
                            setProfileNext(data.nextCursor || null);
                          } catch (e: any) {
                            setProfileError(e?.message || 'Failed to load more');
                          } finally {
                            setProfileLoading(false);
                          }
                        }}
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
            <div>
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

            {/* Feed */}
            <div className="mt-8 divide-y divide-gray-800">
              {feedError && (
                <div className="mb-4 rounded-md border border-red-900/40 bg-red-950/40 text-red-300 text-xs px-3 py-2">
                  {feedError}
                </div>
              )}
              {loadingFeed && posts.length === 0 && (
                <div className="py-8 text-sm text-gray-400">Loading posts…</div>
              )}
              {posts.map((p) => (
                <div key={p.id} className="py-5 flex gap-4">
                  <img src={defaultPfp} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-white">{p.author.username}</span>
                      <span className="text-gray-500">@{p.author.username}{typeof p.author.discriminator === 'number' ? `#${String(p.author.discriminator).padStart(4, '0')}` : ''}</span>
                      <span className="text-gray-600">• {new Date(p.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-[15px] leading-6 text-gray-200 whitespace-pre-wrap">{p.content}</div>
                  </div>
                </div>
              ))}
              {feedLoaded && !loadingFeed && posts.length === 0 && (
                <div className="py-8 text-sm text-gray-400">No posts yet. Be the first to post!</div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

        {/* Right Sidebar - Search */}
        <div className="w-80 border-l border-gray-700 p-6 -translate-x-[380px]">
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

      {/* New Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPostModal(false)} />
          {/* Centered Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setShowPostModal(false)}>
            <div
              className="relative w-full max-w-2xl rounded-[24px] bg-[#0b0b0b] border border-[#1b1b1b] shadow-xl min-h-[180px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Content area */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <img src={defaultPfp} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="What are you cooking ?"
                      className="w-full bg-transparent text-gray-200 placeholder-gray-500/80 outline-none resize-none min-h-[80px] caret-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Post button bottom-right */}
              <div className="absolute right-4 bottom-3">
                <button
                  disabled={!postText.trim() || !token}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium shadow"
                  onClick={async () => {
                    if (!token) return;
                    const created = await apiCreatePost(token, { content: postText.trim() });
                    console.log('Created post', created?.id);
                    setPosts((prev) => [created, ...prev]);
                    // Refetch to keep cursor and ordering consistent
                    try {
                      const data = await apiListPosts({ limit: 20 });
                      console.log('Feed items (after create)', data.items?.length ?? 0);
                      setPosts(data.items || []);
                      setNextCursor(data.nextCursor || null);
                      setFeedLoaded(true);
                    } catch (e) {
                      console.error('Refetch after create failed', e);
                    }
                    setShowPostModal(false);
                    setPostText('');
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Splash Screen */}
      {showSplash && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
          <img src={wryftLogo} alt="Wryft" className="h-[300px] sm:h-[420px] xl:h-[560px] -rotate-6 select-none" />
        </div>
      )}
    </div>
  );
}

export default App;
