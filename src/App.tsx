import { Search, Mail, Lock, X, Home, Bell, MessageCircle, User, Settings, SquarePen, MoreHorizontal } from 'lucide-react';
import { apiMe, apiRegister, apiLogin, apiCreatePost, apiListPosts, apiGetUser, apiGetUserPosts, apiUpdateMe, apiUploadAvatar, apiUploadBanner } from './api';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import loginImg from './login.png';
import signupImg from './SignUp.png';
import wryftLogo from './wryft.png';
import defaultPfp from './default_pfp.png';
import verifiedIcon from './verified.png';

// Simple time-ago helper for timestamps
function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [view, setView] = useState<'home' | 'create' | 'login' | 'profile'>('home');
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; username: string; email: string; discriminator?: number } | null>(null);
  // Invite help modal
  const [showInviteInfo, setShowInviteInfo] = useState(false);
  // Routing helpers
  const location = useLocation();
  const navigate = useNavigate();
  // If visiting someone else's profile via /u/:username
  const [routeUsername, setRouteUsername] = useState<string | null>(null);
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
  const [profileUser, setProfileUser] = useState<
    | null
    | {
        id: string;
        username: string;
        discriminator?: number;
        bio?: string;
        createdAt: string;
        avatarUrl?: string;
        bannerUrl?: string;
      }
  >(null);
  const [profilePosts, setProfilePosts] = useState<Array<{ id: string; content: string; createdAt: string; author: { id: string; username: string; discriminator?: number } }>>([]);
  const [profileNext, setProfileNext] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  // Edit profile modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [saveBioError, setSaveBioError] = useState<string | null>(null);
  // Profile editor previews (UI-only for now)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  // Followers/Following modals (UI-only)
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  // Verified info modal (UI-only)
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);

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

  // Map URL -> view state
  useEffect(() => {
    const path = location.pathname || '/';
    if (path === '/' || path === '/discover') {
      setView('home');
      setActiveTab('discover');
      setRouteUsername(null);
    } else if (path === '/home') {
      setView('home');
      setActiveTab('discover');
      setRouteUsername(null);
    } else if (path === '/login') {
      setView('login');
      setRouteUsername(null);
    } else if (path === '/signup') {
      setView('create');
      setRouteUsername(null);
    } else if (path.startsWith('/u/')) {
      const uname = decodeURIComponent(path.slice(3)) || '';
      if (uname) setRouteUsername(uname);
      setView('profile');
    }
  }, [location.pathname]);

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
      const uname = routeUsername || me?.username;
      if (uname) loadProfile(uname);
    }
  }, [view, me, routeUsername]);

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
        <div className="w-80 border-r border-gray-700 min-h-screen p-8 translate-x-[300px]">
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
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors" onClick={() => navigate('/signup')}>
                  Create account
                </button>
                <button className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors" onClick={() => navigate('/login')}>
                  Sign in
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteInfo(true)}
                className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2"
              >
                Where to get invite?
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <nav className="space-y-4 text-lg">
                <button
                  className={`flex items-center gap-4 py-2 ${view === 'home' ? 'text-white' : 'text-gray-300 hover:text-white transition-colors'}`}
                  onClick={() => {
                    navigate('/home');
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
                  onClick={() => {
                    const uname = me?.username;
                    if (uname) navigate(`/u/${encodeURIComponent(uname)}`);
                    else navigate('/login');
                  }}
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
        <div className="flex-1 px-[300px] h-screen overflow-y-auto no-scrollbar">
          {/* Content Area */}
          <div className="p-8 px-3">
            {view === 'profile' ? (
              <div>
                {/* Profile Header with banner and actions */}
                <div className="border-b border-gray-800">
                  {/* Banner */}
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-gradient-to-r from-purple-900/40 via-purple-700/20 to-transparent">
                    {profileUser?.bannerUrl && (
                      <img src={profileUser.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    )}
                  </div>
                  {/* Avatar + Title Row */}
                  <div className="flex items-start justify-between -mt-8 px-1">
                    <div className="flex items-center gap-4">
                      <img src={profileUser?.avatarUrl || defaultPfp} alt="Profile" className="h-24 w-24 rounded-full object-cover ring-2 ring-[#0a0a0a]" />
                      <div>
                        <div className="text-2xl font-semibold text-white flex items-center gap-2">
                          <span>{profileUser?.username || me?.username}</span>
                          {((profileUser?.username === 'benguin' && profileUser?.discriminator === 1) || (profileUser == null && me?.username === 'benguin' && me?.discriminator === 1)) && (
                            <button type="button" aria-label="Verified badge info" onClick={() => setShowVerifiedInfo(true)} className="inline-flex items-center">
                              <img src={verifiedIcon} alt="Verified" className="h-5 w-5 inline-block align-text-top" />
                            </button>
                          )}
                        </div>
                        <div className="text-gray-400 text-sm">
                          @{(profileUser?.username || me?.username) || 'user'}
                          {typeof (profileUser?.discriminator ?? me?.discriminator) === 'number' ? `#${String(profileUser?.discriminator ?? me?.discriminator).padStart(4,'0')}` : ''}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="pt-4">
                      {(profileUser == null || profileUser?.username === me?.username) ? (
                        <button
                          className="px-4 py-2 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 text-sm"
                          onClick={() => {
                            setSaveBioError(null);
                            setBioDraft(profileUser?.bio || '');
                            setBannerPreview(profileUser?.bannerUrl || null);
                            setAvatarPreview(profileUser?.avatarUrl || null);
                            setShowEditProfile(true);
                          }}
                        >
                          Edit profile
                        </button>
                      ) : (
                        <button className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm">Follow</button>
                      )}
                    </div>
                  </div>
                  {/* Bio + Meta */}
                  <div className="mt-3 px-1 pb-4">
                    {profileUser?.bio && (
                      <div className="text-gray-300 text-sm mt-1 whitespace-pre-wrap">{profileUser.bio}</div>
                    )}
                    {profileUser?.createdAt && (
                      <div className="text-gray-500 text-xs mt-2">Joined {new Date(profileUser.createdAt).toLocaleString(undefined, { month: 'short', year: 'numeric' })}</div>
                    )}
                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="text-gray-300"><span className="font-semibold text-white">{profilePosts.length}</span> Posts</div>
                      <button type="button" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 cursor-pointer" onClick={() => setShowFollowing(true)} aria-label="View following list">
                        0 Following
                      </button>
                      <button type="button" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 cursor-pointer" onClick={() => setShowFollowers(true)} aria-label="View followers list">
                        0 Followers
                      </button>
                    </div>
                    {/* Tabs */}
                    <div className="mt-4 border-b border-gray-800">
                      <div className="flex items-center gap-6">
                        <button className="px-4 py-3 border-b-2 border-purple-500 text-white text-sm">Posts</button>
                        <button className="px-4 py-3 text-gray-400 text-sm">Replies</button>
                        <button className="px-4 py-3 text-gray-400 text-sm">Media</button>
                        <button className="px-4 py-3 text-gray-400 text-sm">Likes</button>
                      </div>
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
                          <button type="button" aria-label="Verified badge info" onClick={() => setShowVerifiedInfo(true)} className="inline-flex items-center">
                            <img src={verifiedIcon} alt="Verified" className="h-4 w-4 inline-block align-text-top" />
                          </button>
                        )}
                      </span>
                          <span className="text-gray-500">@{p.author.username}{typeof p.author.discriminator === 'number' ? `#${String(p.author.discriminator).padStart(4, '0')}` : ''}</span>
                          <span className="text-gray-600">• {timeAgo(p.createdAt)}</span>
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
                      <span className="text-gray-600">• {timeAgo(p.createdAt)}</span>
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
        <div className="w-80 border-l border-gray-700 p-6 -translate-x-[300px]">
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

      {/* Invite Info Modal */}
      {showInviteInfo && (
        <div className="fixed inset-0 z-[55]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInviteInfo(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setShowInviteInfo(false)}>
            <div
              className="relative w-full max-w-md rounded-2xl bg-[#0b0b0b] border border-[#1b1b1b] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                aria-label="Close"
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
                onClick={() => setShowInviteInfo(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-3">Getting an invite</h3>
                <p className="text-sm text-gray-300">To get an invite you have to have good contact with one of the owners of the site.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal (root-level overlay) */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditProfile(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setShowEditProfile(false)}>
            <div className="relative w-full max-w-2xl rounded-2xl bg-[#0b0b0b] border border-[#1b1b1b] shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1b1b1b]">
                <div className="flex items-center gap-2">
                  <button aria-label="Close" className="text-gray-300 hover:text-white" onClick={() => setShowEditProfile(false)}>
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-semibold">Edit profile</h3>
                </div>
                <button
                  className="px-4 py-1.5 rounded-full bg-purple-700 hover:bg-purple-600 text-sm"
                  disabled={savingBio || !token}
                  onClick={async () => {
                    if (!token) return;
                    try {
                      setSavingBio(true);
                      setSaveBioError(null);
                      // Upload images if new data URLs selected
                      let current = null as any;
                      if (bannerPreview && bannerPreview.startsWith('data:')) {
                        current = await apiUploadBanner(token, bannerPreview);
                      }
                      if (avatarPreview && avatarPreview.startsWith('data:')) {
                        current = await apiUploadAvatar(token, avatarPreview);
                      }
                      const updated = await apiUpdateMe(token, { bio: bioDraft.trim() || undefined });
                      const merged = current ? { ...updated, ...current } : updated;
                      setProfileUser((prev) => (prev ? { ...prev, bio: merged.bio, avatarUrl: merged.avatarUrl ?? prev.avatarUrl, bannerUrl: merged.bannerUrl ?? prev.bannerUrl } : prev));
                      setShowEditProfile(false);
                    } catch (e: any) {
                      setSaveBioError(e?.message || 'Failed to save');
                    } finally {
                      setSavingBio(false);
                    }
                  }}
                >
                  {savingBio ? 'Saving…' : 'Save'}
                </button>
              </div>

              {/* Banner area */}
              <div className="relative h-40 sm:h-48 bg-[#111]">
                {/* Preview or placeholder */}
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-purple-700/20 to-transparent" />
                )}
                {/* Controls */}
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    className="h-9 w-9 rounded-full bg-black/60 text-gray-100 flex items-center justify-center ring-1 ring-white/10 hover:bg-black/70"
                    onClick={() => bannerInputRef.current?.click()}
                    type="button"
                    aria-label="Upload banner"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 5v14m7-7H5"/></svg>
                  </button>
                  {bannerPreview && (
                    <button
                      className="h-9 w-9 rounded-full bg-black/60 text-gray-100 flex items-center justify-center ring-1 ring-white/10 hover:bg-black/70"
                      onClick={() => setBannerPreview(null)}
                      type="button"
                      aria-label="Remove banner"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setBannerPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>

                {/* Avatar overlay */}
                <div className="absolute -bottom-10 left-6">
                  <div className="relative h-20 w-20 rounded-full ring-4 ring-[#0b0b0b] overflow-hidden bg-[#111]">
                    <img src={avatarPreview || defaultPfp} alt="Avatar preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-90"
                      aria-label="Upload avatar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 5v14m7-7H5"/></svg>
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => setAvatarPreview(null)}
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                        aria-label="Remove avatar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setAvatarPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form body */}
              <div className="px-5 pt-14 pb-5">
                {/* Name (read-only for now) */}
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  value={profileUser?.username || me?.username || ''}
                  readOnly
                  className="w-full bg-[#121212] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300"
                />
                {/* Bio */}
                <label className="block text-xs text-gray-400 mt-4 mb-1">Bio (max 280)</label>
                <textarea
                  value={bioDraft}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 280);
                    setBioDraft(v);
                  }}
                  placeholder="Tell people about yourself"
                  className="w-full bg-[#121212] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-gray-700 min-h-[100px]"
                />
                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>{bioDraft.length}/280</span>
                  {saveBioError && <span className="text-red-400">{saveBioError}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Following Modal (UI only, centered) */}
      {showFollowing && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowFollowing(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setShowFollowing(false)}>
            <div className="relative w-full max-w-md rounded-2xl bg-[#0b0b0b] border border-[#1b1b1b] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <button aria-label="Close" className="absolute right-3 top-3 text-gray-400 hover:text-white" onClick={() => setShowFollowing(false)}>
                <X className="w-5 h-5" />
              </button>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-3">Following</h3>
                <div className="text-sm text-gray-400">No following yet.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal (UI only, centered) */}
      {showFollowers && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowFollowers(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setShowFollowers(false)}>
            <div className="relative w-full max-w-md rounded-2xl bg-[#0b0b0b] border border-[#1b1b1b] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <button aria-label="Close" className="absolute right-3 top-3 text-gray-400 hover:text-white" onClick={() => setShowFollowers(false)}>
                <X className="w-5 h-5" />
              </button>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-3">Followers</h3>
                <div className="text-sm text-gray-400">No followers yet.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verified Info Modal (UI only, centered) */}
      {showVerifiedInfo && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowVerifiedInfo(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setShowVerifiedInfo(false)}>
            <div className="relative w-full max-w-md rounded-2xl bg-[#0b0b0b] border border-[#1b1b1b] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <button aria-label="Close" className="absolute right-3 top-3 text-gray-400 hover:text-white" onClick={() => setShowVerifiedInfo(false)}>
                <X className="w-5 h-5" />
              </button>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-1">This account is verified</h3>
                <p className="text-sm text-gray-300 mb-4">This account has a checkmark because it has been verified by trusted sources.</p>
                <div className="text-xs text-gray-400 mb-2">Verified by:</div>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/u/wryft');
                    setShowVerifiedInfo(false);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-black/20 px-3 py-2 hover:border-gray-700 transition-colors">
                    <img src={wryftLogo} alt="Wryft" className="h-8 w-8 rounded" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-sm text-white font-semibold">
                        wryft <img src={verifiedIcon} alt="Verified" className="h-4 w-4 inline-block" />
                      </div>
                      <div className="text-xs text-gray-500">@wryft#0001</div>
                    </div>
                    <span className="text-xs text-gray-500">View profile →</span>
                  </div>
                </button>
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-4 py-2 rounded-lg bg-black/40 border border-gray-800 text-sm text-gray-300 cursor-not-allowed" disabled>
                    Learn more
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm" onClick={() => setShowVerifiedInfo(false)}>
                    Close
                  </button>
                </div>
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
