import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Search, Library, Play, Pause, 
  SkipBack, SkipForward, Music, 
  Heart, User, ArrowLeft, 
  ListMusic, Volume2, Mic2, MoreHorizontal,
  Flame, Disc, Radio, Repeat, LogOut, 
  CheckCircle2, XCircle, Loader2, X,
  Shuffle, Lock, Maximize2, Minimize2,
  Plus, Sun, Moon
} from 'lucide-react';
import { 
  initializeApp 
} from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig ={
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Assets ---
const CUSTOM_LOGO_URL = null; 

// --- Utils ---
const formatTime = (millis) => {
  if (!millis && millis !== 0) return "0:00";
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(0);
  return minutes + ":" + (parseInt(seconds) < 10 ? '0' : '') + seconds;
};

const mapItunesTrack = (track) => ({
  id: track.trackId,
  title: track.trackName,
  artist: track.artistName,
  album: track.collectionName,
  cover: track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '600x600') : null,
  duration: formatTime(track.trackTimeMillis), 
  previewUrl: track.previewUrl, 
  releaseDate: track.releaseDate
});

// --- Constants ---
const ACCENT_COLOR = "text-[#fa233b]"; 

// --- Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bg = type === 'error' ? 'bg-red-500/95' : 'bg-green-500/95';
  const icon = type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 ${bg} backdrop-blur-md text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100] animate-slide-down border border-white/10`}>
      {icon}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

const BrandLogo = () => {
  if (CUSTOM_LOGO_URL) {
    return (
      <div className="flex items-center gap-2">
        <img src={CUSTOM_LOGO_URL} alt="Music App" className="w-8 h-8 object-contain" />
        <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">Music App</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[var(--text-primary)]">
        <div className="w-8 h-8 bg-gradient-to-br from-[#fa233b] to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
            <Music size={18} className="text-white" fill="white" />
        </div>
        <span className="font-bold text-xl tracking-tight">Music App</span>
    </div>
  );
};

const BottomNav = ({ currentView, setView, openProfile, isGuest, requestLogin, theme, toggleTheme }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  const NavItem = ({ view, icon: Icon, label, locked }) => (
    <button 
      onClick={() => {
        if (locked && isGuest) {
          requestLogin();
        } else {
          setView(view);
        }
      }}
      className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${currentView === view ? 'text-[#fa233b]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
    >
      <div className="relative">
        <Icon size={24} className={currentView === view ? ACCENT_COLOR : ""} />
        {locked && isGuest && (
          <div className="absolute -top-1 -right-1 bg-[var(--bg-surface-1)] rounded-full p-[1px]">
            <Lock size={10} className="text-[var(--text-secondary)]" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => setShowMoreMenu(false)}>
           <div 
             ref={menuRef}
             className="absolute bottom-20 right-4 w-56 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl p-2 flex flex-col gap-1 animate-slide-up-sm origin-bottom-right"
             onClick={(e) => e.stopPropagation()}
           >
              <button 
                onClick={() => { setView('radio'); setShowMoreMenu(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'radio' ? 'bg-[#fa233b]/10 text-[#fa233b]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'}`}
              >
                 <Radio size={20} />
                 <span className="font-medium text-sm">Radio</span>
              </button>

              <button 
                onClick={() => { toggleTheme(); setShowMoreMenu(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
              >
                 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                 <span className="font-medium text-sm">Appearance: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
              
              <div className="h-[1px] bg-[var(--border)] mx-2 my-1" />
              
              <button 
                onClick={() => { openProfile(); setShowMoreMenu(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
              >
                 <User size={20} />
                 <span className="font-medium text-sm">Profile</span>
              </button>
           </div>
        </div>
      )}

      {/* Mobile Bottom Bar - Reduced Transparency */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-surface-1)] border-t border-[var(--border)] flex items-center justify-around z-50 pb-safe shadow-lg">
        <NavItem view="home" icon={Home} label="Home" />
        <NavItem view="search" icon={Search} label="Search" />
        <NavItem view="library" icon={Library} label="Library" locked={true} />
        <NavItem view="artists" icon={Mic2} label="Artists" locked={true} />
        
        <button 
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${showMoreMenu ? 'text-[#fa233b]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          {/* Removed fill-current */}
          <MoreHorizontal size={24} className={showMoreMenu ? ACCENT_COLOR : ""} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </>
  );
};

const CreatePlaylistModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState("");
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[var(--bg-sidebar)] w-full max-w-sm rounded-2xl border border-[var(--border)] p-6 relative shadow-2xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">New Playlist</h3>
                <input 
                    autoFocus
                    type="text" 
                    placeholder="My Awesome Mix" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[var(--bg-surface-2)] text-[var(--text-primary)] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#fa233b] mb-6 placeholder:text-[var(--text-secondary)] border border-transparent focus:border-[#fa233b]"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim()) {
                            onCreate(name);
                            setName("");
                            onClose();
                        }
                    }}
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] transition">Cancel</button>
                    <button 
                        onClick={() => { onCreate(name); setName(""); onClose(); }} 
                        disabled={!name.trim()}
                        className="flex-1 py-3 bg-[#fa233b] text-white rounded-xl font-bold hover:bg-[#d41e32] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfileModal = ({ isOpen, onClose, user, onAuth, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[var(--bg-sidebar)] w-full max-w-sm rounded-2xl border border-[var(--border)] p-6 relative shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={20} />
            </button>
            
            <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-surface-2)] mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-[var(--border)]">
                    {user && !user.isAnonymous && user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={32} className="text-[var(--text-secondary)]" />
                    )}
                </div>
                {user && !user.isAnonymous ? (
                    <>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{user.displayName}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">Guest User</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Sign in to sync your music.</p>
                    </>
                )}
            </div>

            <div className="space-y-3">
                {user && !user.isAnonymous ? (
                    <button 
                        onClick={() => { onAuth(); onClose(); }}
                        className="w-full py-3 bg-[#fa233b]/10 text-[#fa233b] rounded-xl font-semibold text-sm hover:bg-[#fa233b]/20 transition flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                ) : (
                    <button 
                        onClick={() => { onAuth(); onClose(); }}
                        className="w-full py-3 bg-[var(--text-primary)] text-[var(--bg-main)] rounded-xl font-bold text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />}
                        Sign In with Google
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

const ProfileButton = ({ user, onAuth, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAuthAction = () => {
    setIsOpen(false);
    onAuth();
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center hover:bg-[var(--bg-surface-3)] transition-colors border border-[var(--border)] shadow-sm overflow-hidden"
      >
        {isLoading ? (
            <Loader2 size={18} className="text-[#fa233b] animate-spin" />
        ) : user && !user.isAnonymous && user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
        ) : (
            <User size={18} className="text-[#fa233b]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 flex flex-col animate-zoom-in origin-top-right">
            {user && !user.isAnonymous ? (
                <>
                    <div className="px-3 py-3 mb-1 bg-[var(--bg-surface-2)]/50 rounded-lg border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block mb-1">Signed in as</span>
                        <span className="text-[var(--text-primary)] font-semibold truncate block text-sm">{user.displayName || "User"}</span>
                        <span className="text-xs text-[var(--text-secondary)] truncate block">{user.email}</span>
                    </div>
                    
                    <div className="h-[1px] bg-[var(--border)] my-1 mx-2"></div>

                    <button onClick={handleAuthAction} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#fa233b] hover:bg-[#fa233b]/10 rounded-lg transition-colors text-left w-full font-medium">
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </>
            ) : (
                <>
                    <div className="px-4 py-4 text-center">
                        <h3 className="text-[var(--text-primary)] font-bold text-base">Profile</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">Sign in to sync your library across devices.</p>
                    </div>
                    <button onClick={handleAuthAction} className="flex items-center justify-center gap-3 px-4 py-3 text-sm bg-[var(--text-primary)] text-[var(--bg-main)] font-bold hover:opacity-90 rounded-lg transition-colors w-full mb-1">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
                        Sign In with Google
                    </button>
                </>
            )}
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, locked }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-1)]'}`}
  >
    <div className="flex items-center gap-3">
        <Icon size={20} className={active ? ACCENT_COLOR : ""} />
        <span>{label}</span>
    </div>
    {locked && <Lock size={12} className="text-[var(--text-secondary)]" />}
  </button>
);

const Sidebar = ({ currentView, setView, isGuest, requestLogin, theme, toggleTheme }) => (
  <div className="hidden md:flex flex-col w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] p-4 pt-8 h-full z-30">
    <div className="mb-8 px-3">
        <BrandLogo />
    </div>
    
    <div className="space-y-1">
      <div className="px-3 pb-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Discover</div>
      <SidebarItem icon={Home} label="Home" active={currentView === 'home'} onClick={() => setView('home')} />
      <SidebarItem icon={Search} label="Search" active={currentView === 'search'} onClick={() => setView('search')} />
      <SidebarItem icon={Radio} label="Radio" active={currentView === 'radio'} onClick={() => setView('radio')} />
    </div>

    <div className="mt-8 space-y-1">
      <div className="px-3 pb-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Your Library</div>
      <SidebarItem 
        icon={Library} 
        label="Library" 
        active={currentView === 'library' || currentView === 'liked-songs'} 
        onClick={() => isGuest ? requestLogin() : setView('library')} 
        locked={isGuest}
      />
      <SidebarItem 
        icon={Mic2} 
        label="Artists" 
        active={currentView === 'artists'} 
        onClick={() => isGuest ? requestLogin() : setView('artists')} 
        locked={isGuest}
      />
    </div>

    {/* Theme Toggle - Desktop Sidebar */}
    <div className="mt-auto px-3">
        <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-1)] transition-colors"
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
    </div>
  </div>
);

const QueueOverlay = ({ isOpen, currentTrack, queue, onClose, onPlayTrack }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute bottom-[90px] md:bottom-[96px] right-4 left-4 md:left-auto md:w-80 bg-[var(--bg-surface-1)] border border-[var(--border)] rounded-xl shadow-2xl p-4 flex flex-col gap-2 max-h-[50vh] md:max-h-[400px] z-[60] animate-slide-up-sm">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-[var(--border)]">
                <span className="font-bold text-[var(--text-primary)] text-sm">Up Next</span>
                <button onClick={onClose}><X size={16} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"/></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
                {queue && queue.length > 0 ? queue.map((song, i) => (
                    <div key={song.id + i} onClick={() => onPlayTrack(song)} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-surface-2)] cursor-pointer group ${currentTrack?.id === song.id ? 'bg-[var(--bg-surface-2)]' : ''}`}>
                        <img src={song.cover} className="w-8 h-8 rounded bg-[var(--bg-surface-2)]" alt=""/>
                        <div className="flex-1 overflow-hidden">
                            <div className={`text-xs font-bold truncate ${currentTrack?.id === song.id ? 'text-[#fa233b]' : 'text-[var(--text-primary)]'}`}>{song.title}</div>
                            <div className="text-[10px] text-[var(--text-secondary)] truncate">{song.artist}</div>
                        </div>
                        {currentTrack?.id === song.id && <Volume2 size={12} className="text-[#fa233b]"/>}
                    </div>
                )) : (
                    <div className="text-xs text-[var(--text-secondary)] text-center py-4">Queue is empty</div>
                )}
            </div>
        </div>
    );
};

// Fullscreen Player Component
const FullscreenPlayer = ({ 
  isOpen, onClose, currentTrack, isPlaying, 
  onPlayPause, onNext, onPrev, progress, 
  currentTime, duration, onLike, isLiked, 
  volume, setVolume, isRepeat, toggleRepeat,
  isShuffle, toggleShuffle, queue, onPlayTrack
}) => {
    const [showQueue, setShowQueue] = useState(false);

    if (!isOpen || !currentTrack) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col animate-slide-up">
            {/* Background Blur - Always dark for immersive player */}
            <div className="absolute inset-0 z-0">
                <img src={currentTrack.cover} className="w-full h-full object-cover opacity-30 blur-3xl scale-125" alt="" />
                <div className="absolute inset-0 bg-black/60"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center p-6 md:p-8 shrink-0">
                <button onClick={onClose} className="text-gray-400 hover:text-white transition p-2 bg-white/5 rounded-full backdrop-blur-md">
                    <Minimize2 size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Now Playing</span>
                    <span className="text-sm font-bold text-white">{currentTrack.album || "Unknown Album"}</span>
                </div>
                <button 
                    onClick={() => setShowQueue(!showQueue)}
                    className={`transition p-2 rounded-full ${showQueue ? 'bg-[#fa233b] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <ListMusic size={24} />
                </button>
            </div>

            {/* Middle Content Area (Swappable) */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-20 overflow-hidden mb-6 shrink-0 min-h-0">
                {showQueue ? (
                    // QUEUE VIEW
                    <div className="w-full h-full max-w-xl mx-auto bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col overflow-hidden animate-zoom-in">
                        <div className="p-4 border-b border-white/10 sticky top-0 bg-black/20 backdrop-blur-sm z-10">
                            <h3 className="text-lg font-bold text-white">Up Next</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                             {queue && queue.length > 0 ? queue.map((song, i) => (
                                <div key={song.id + i} onClick={() => onPlayTrack(song)} className={`flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 cursor-pointer group ${currentTrack?.id === song.id ? 'bg-white/10' : ''}`}>
                                    <span className="text-gray-500 w-6 text-center text-sm font-mono">{i + 1}</span>
                                    <img src={song.cover} className="w-10 h-10 rounded-lg bg-gray-800" alt=""/>
                                    <div className="flex-1 overflow-hidden">
                                        <div className={`text-sm font-bold truncate ${currentTrack?.id === song.id ? 'text-[#fa233b]' : 'text-white'}`}>{song.title}</div>
                                        <div className="text-xs text-gray-400 truncate">{song.artist}</div>
                                    </div>
                                    {currentTrack?.id === song.id && <Volume2 size={16} className="text-[#fa233b]"/>}
                                </div>
                            )) : (
                                <div className="text-gray-500 text-center py-10">Queue is empty</div>
                            )}
                        </div>
                    </div>
                ) : (
                    // ARTWORK VIEW
                    <div className="w-full max-w-sm aspect-square rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative group animate-fade-in">
                        <img src={currentTrack.cover} className="w-full h-full object-cover" alt={currentTrack.title} />
                    </div>
                )}
            </div>

            {/* Bottom Controls Container (Fixed & Always Visible) */}
            <div className="relative z-10 w-full max-w-xl mx-auto px-8 md:px-12 pb-12 flex flex-col justify-end">
                {/* Track Info */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col gap-1 pr-4 min-w-0">
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight truncate">{currentTrack.title}</h2>
                        <h3 className="text-lg md:text-xl text-gray-400 font-medium truncate">{currentTrack.artist}</h3>
                    </div>
                    <button onClick={() => onLike(currentTrack)} className="p-3 rounded-full hover:bg-white/10 transition shrink-0">
                        <Heart size={28} className={isLiked ? "text-[#fa233b] fill-[#fa233b]" : "text-white"} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 group w-full">
                    <div className="relative h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden hover:h-2 transition-all">
                        <div className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#fa233b] transition-colors" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-gray-400 mt-2 font-mono">
                        <span>{currentTime}</span>
                        <span>{duration}</span>
                    </div>
                </div>

                {/* Controls - Organized Row */}
                <div className="flex items-center justify-between mb-8 w-full">
                    <button onClick={toggleShuffle} className={`p-2 rounded-full transition ${isShuffle ? 'text-[#fa233b]' : 'text-gray-400 hover:text-white'}`}>
                        <Shuffle size={20} />
                    </button>
                    
                    <button onClick={onPrev} className="p-2 text-white hover:text-[#fa233b] transition">
                        <SkipBack size={32} fill="currentColor" />
                    </button>
                    
                    <button onClick={onPlayPause} className="w-16 h-16 bg-[#fa233b] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition">
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    
                    <button onClick={onNext} className="p-2 text-white hover:text-[#fa233b] transition">
                        <SkipForward size={32} fill="currentColor" />
                    </button>
                    
                    <button onClick={toggleRepeat} className={`p-2 rounded-full transition ${isRepeat ? 'text-[#fa233b]' : 'text-gray-400 hover:text-white'}`}>
                        <Repeat size={20} />
                    </button>
                </div>

                {/* Volume - Simplified */}
                <div className="flex items-center gap-4 px-4 opacity-70 hover:opacity-100 transition-opacity">
                    <Volume2 size={20} className="text-white" />
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volume} 
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white hover:accent-[#fa233b]"
                    />
                </div>
            </div>
        </div>
    );
};

const PlayerBar = ({ 
    currentTrack, isPlaying, onPlayPause, onNext, onPrev, onLike, 
    isLiked, queue, onPlayTrack, isShuffle, toggleShuffle, isRepeat, toggleRepeat 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showQueue, setShowQueue] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
  }, []);

  // Sync state with browser fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setShowFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleEnterFullscreen = () => {
    // Attempt to enter browser fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
        // Fallback: just show the overlay if API fails
        setShowFullscreen(true);
      });
    } else {
      setShowFullscreen(true);
    }
  };

  const handleExitFullscreen = () => {
    // Attempt to exit browser fullscreen
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error("Error attempting to exit fullscreen:", err));
    } else {
      setShowFullscreen(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack || !audio) return;

    if (audio.src !== currentTrack.previewUrl) {
      audio.src = currentTrack.previewUrl;
      audio.load();
      if (isPlaying) audio.play().catch(e => console.error(e));
    } else {
      isPlaying ? audio.play() : audio.pause();
    }

    const updateTime = () => setCurrentTime(audio.currentTime * 1000);
    const updateDuration = () => setDuration(audio.duration * 1000);
    const handleEnded = () => {
        if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
        } else {
            onNext();
        }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, isPlaying, onNext, isRepeat]);

  useEffect(() => {
      if(audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume])

  if (!currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
        <FullscreenPlayer 
            isOpen={showFullscreen} 
            onClose={handleExitFullscreen}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onNext={onNext}
            onPrev={onPrev}
            progress={progress}
            currentTime={formatTime(currentTime)}
            duration={formatTime(duration)}
            onLike={onLike}
            isLiked={isLiked}
            volume={volume}
            setVolume={setVolume}
            isRepeat={isRepeat}
            toggleRepeat={toggleRepeat}
            isShuffle={isShuffle}
            toggleShuffle={toggleShuffle}
            queue={queue}
            onPlayTrack={onPlayTrack}
        />

        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 h-16 md:h-[88px] bg-[var(--bg-surface-1)]/95 backdrop-blur-md border-t border-[var(--border)] flex items-center px-4 md:px-6 z-50 shadow-2xl transition-all">
        <QueueOverlay isOpen={showQueue} currentTrack={currentTrack} queue={queue} onClose={() => setShowQueue(false)} onPlayTrack={onPlayTrack} />
        
        {/* Track Info */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 md:w-[30%] md:flex-none min-w-0 mr-4 md:mr-0">
            <div className="relative group cursor-pointer" onClick={handleEnterFullscreen}>
                <img 
                src={currentTrack.cover} 
                alt="cover" 
                className="h-10 w-10 md:h-12 md:w-12 rounded-[4px] shadow-sm object-cover bg-[var(--bg-surface-2)] border border-[var(--border)]" 
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[4px] transition-opacity">
                    <Maximize2 size={16} className="text-white" />
                </div>
            </div>
            
            <div className="flex flex-col justify-center overflow-hidden min-w-0">
            <span className="text-[var(--text-primary)] text-sm font-medium truncate cursor-default">{currentTrack.title}</span>
            <span className="text-[var(--text-secondary)] text-xs truncate cursor-default hover:underline">{currentTrack.artist}</span>
            </div>
            <button onClick={() => onLike(currentTrack)} className="ml-2 focus:outline-none hidden md:block">
                <Heart size={18} className={isLiked ? "text-[#fa233b] fill-[#fa233b]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"} />
            </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center md:flex-1 max-w-2xl px-0 md:px-4 gap-1 flex-none">
            <div className="flex items-center gap-4 md:gap-8">
                <button 
                    onClick={toggleRepeat} 
                    className={`transition hidden md:block ${isRepeat ? 'text-[#fa233b]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    title="Repeat"
                >
                    <Repeat size={18} />
                </button>
                
                <button onClick={onPrev} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition hidden md:block"><SkipBack size={24} fill="currentColor" /></button>
                
                <button 
                onClick={onPlayPause}
                className="text-[var(--text-primary)] hover:scale-105 transition"
                >
                {isPlaying ? <Pause size={28} fill="currentColor" className="md:w-9 md:h-9" /> : <Play size={28} fill="currentColor" className="md:w-9 md:h-9" />}
                </button>
                
                <button onClick={onNext} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition hidden md:block"><SkipForward size={24} fill="currentColor" /></button>
                
                <button 
                    onClick={toggleShuffle} 
                    className={`transition hidden md:block ${isShuffle ? 'text-[#fa233b]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    <Shuffle size={18} />
                </button>
            </div>
            
            <div className="w-full flex items-center gap-3 text-[10px] text-[var(--text-secondary)] font-medium hidden md:flex">
                <span className="w-8 text-right">{formatTime(currentTime)}</span>
                <div className="relative flex-1 h-[3px] bg-[var(--bg-surface-3)] rounded-full overflow-hidden group cursor-pointer">
                    <div 
                        className="absolute top-0 left-0 h-full bg-[var(--text-secondary)] group-hover:bg-[#fa233b] transition-colors"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className="w-8">{formatTime(duration)}</span>
            </div>
        </div>

        {/* Volume & Extras */}
        <div className="hidden md:flex w-[30%] justify-end items-center gap-4">
            <button onClick={() => setShowQueue(!showQueue)} className={`transition ${showQueue ? 'text-[#fa233b]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                <ListMusic size={18} />
            </button>
            <div className="flex items-center gap-2 group">
                <Volume2 size={18} className="text-[var(--text-secondary)]" />
                <input 
                    type="range" 
                    min="0" 
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-[var(--bg-surface-3)] rounded-full appearance-none cursor-pointer accent-[var(--text-secondary)] hover:accent-[#fa233b]"
                />
            </div>
        </div>
        </div>
    </>
  );
};

// ... AlbumCard, RadioView, ArtistsView, DetailView, HomeView, SearchView ...

const AlbumCard = ({ playlist, onClick }) => (
  <div onClick={() => onClick(playlist.id)} className="group cursor-pointer flex flex-col gap-2">
    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[var(--bg-surface-2)] shadow-sm">
      <img src={playlist.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop"} alt={playlist.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 bg-[#fa233b] rounded-full flex items-center justify-center shadow-lg text-white">
            <Play size={20} fill="white" className="ml-1" />
        </div>
      </div>
    </div>
    <div>
        <h3 className="text-[var(--text-primary)] text-[15px] font-medium leading-tight truncate">{playlist.title}</h3>
        <p className="text-[var(--text-secondary)] text-[13px] truncate">Mix • {playlist.category || "General"}</p>
    </div>
  </div>
);

const RadioView = ({ onPlayTrack, currentTrack, user, onAuth, isLoading }) => {
    const stations = [
        { id: 'lofi', title: 'Lo-Fi Station', query: 'lofi study', color: 'from-purple-500 to-indigo-600' },
        { id: 'pop', title: 'Pop Hits Radio', query: 'top pop hits', color: 'from-pink-500 to-rose-600' },
        { id: 'rock', title: 'Classic Rock', query: 'classic rock', color: 'from-red-600 to-orange-600' },
        { id: 'jazz', title: 'Jazz Lounge', query: 'jazz instrumental', color: 'from-amber-500 to-yellow-600' },
        { id: 'workout', title: 'Workout Energy', query: 'workout gym', color: 'from-green-500 to-emerald-600' },
        { id: 'sleep', title: 'Sleep & Relax', query: 'ambient sleep', color: 'from-blue-500 to-cyan-600' },
    ];

    const playStation = async (station) => {
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(station.query)}&media=music&entity=song&limit=20`);
            const data = await res.json();
            const tracks = data.results.map(mapItunesTrack);
            if(tracks.length > 0) {
                const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
                onPlayTrack(randomTrack, tracks);
            }
        } catch(e) {
            console.error("Error playing radio", e);
        }
    };

    return (
        <div className="pb-40 md:pb-32 px-4 md:px-10 pt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Radio</h1>
                <div className="hidden md:block">
                    <ProfileButton user={user} onAuth={onAuth} isLoading={isLoading} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stations.map(station => (
                    <div key={station.id} onClick={() => playStation(station)} className={`group relative h-40 rounded-xl bg-gradient-to-br ${station.color} overflow-hidden cursor-pointer shadow-lg hover:scale-[1.02] transition-transform`}>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <h3 className="text-2xl font-bold text-white drop-shadow-md z-10">{station.title}</h3>
                            <Radio className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-white/10 rotate-12" />
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center absolute opacity-0 group-hover:opacity-100 transition-opacity shadow-xl transform translate-y-2 group-hover:translate-y-0">
                                <Play size={20} fill="black" className="ml-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// UPDATED: Now acts as a Library Dashboard with a "Liked Songs" card
const LibraryView = ({ likedSongs, onNavigateToLiked, user, onAuth, isLoading, userPlaylists, onCreatePlaylist, onNavigateToPlaylist }) => {
    return (
        <div className="pb-40 md:pb-32 px-4 md:px-10 pt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Library</h1>
                <div className="hidden md:block">
                    <ProfileButton user={user} onAuth={onAuth} isLoading={isLoading} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8">
                {/* Liked Songs Card */}
                <div onClick={onNavigateToLiked} className="group cursor-pointer flex flex-col gap-2">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm flex items-center justify-center">
                        <Heart size={48} className="text-white fill-white" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 bg-[#fa233b] rounded-full flex items-center justify-center shadow-lg text-white">
                                <Play size={20} fill="white" className="ml-1" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[var(--text-primary)] text-[15px] font-medium leading-tight truncate">Liked Songs</h3>
                        <p className="text-[var(--text-secondary)] text-[13px] truncate">Playlist • {likedSongs.length} songs</p>
                    </div>
                </div>

                {/* Create Playlist Card */}
                <div onClick={onCreatePlaylist} className="group cursor-pointer flex flex-col gap-2">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[var(--bg-surface-2)] border border-dashed border-[var(--text-secondary)] hover:border-[#fa233b] transition-colors flex items-center justify-center">
                        <Plus size={48} className="text-[var(--text-secondary)] group-hover:text-[#fa233b] transition-colors" />
                    </div>
                    <div>
                        <h3 className="text-[var(--text-primary)] text-[15px] font-medium leading-tight truncate">Create Playlist</h3>
                        <p className="text-[var(--text-secondary)] text-[13px] truncate">New Collection</p>
                    </div>
                </div>

                {/* User Created Playlists */}
                {userPlaylists.map((pl) => (
                    <div key={pl.id} onClick={() => onNavigateToPlaylist(pl.id)} className="group cursor-pointer flex flex-col gap-2">
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[var(--bg-surface-2)] shadow-sm flex items-center justify-center">
                            {pl.songs && pl.songs.length > 0 ? (
                                <img src={pl.songs[0].cover} alt={pl.title} className="w-full h-full object-cover" />
                            ) : (
                                <Music size={48} className="text-[var(--text-secondary)]" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 bg-[#fa233b] rounded-full flex items-center justify-center shadow-lg text-white">
                                    <Play size={20} fill="white" className="ml-1" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[var(--text-primary)] text-[15px] font-medium leading-tight truncate">{pl.title}</h3>
                            <p className="text-[var(--text-secondary)] text-[13px] truncate">Playlist • {pl.songs ? pl.songs.length : 0} songs</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ArtistsView = ({ playlists, user, onAuth, isLoading }) => {
    // Aggregate unique artists from playlists
    const allArtists = new Set();
    const artistData = [];

    playlists.forEach((pl) => {
        if(pl.songs) {
            pl.songs.forEach((song) => {
                if(!allArtists.has(song.artist)) {
                    allArtists.add(song.artist);
                    artistData.push({ name: song.artist, cover: song.cover });
                }
            });
        }
    });

    return (
        <div className="pb-40 md:pb-32 px-4 md:px-10 pt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Artists</h1>
                <div className="hidden md:block">
                    <ProfileButton user={user} onAuth={onAuth} isLoading={isLoading} />
                </div>
            </div>
            
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 md:gap-8">
                {artistData.slice(0, 15).map((artist, i) => (
                    <div key={i} className="flex flex-col items-center group cursor-pointer p-4 rounded-xl hover:bg-[var(--bg-surface-2)] transition-colors">
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden shadow-lg mb-4 bg-[var(--bg-surface-2)] border-2 border-transparent group-hover:border-[#fa233b] transition-all">
                            <img src={artist.cover} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h3 className="text-[var(--text-primary)] font-medium text-center truncate w-full px-2">{artist.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Artist</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DetailView = ({ playlist, onPlayTrack, currentTrack, isPlaying, onBack, user, onAuth, isLoading, onLike, likedSongs }) => {
    return (
        <div className="pb-40 md:pb-32 px-4 md:px-10 pt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                 <button onClick={onBack} className="flex items-center gap-1 text-[#fa233b] font-medium hover:underline transition-all">
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
                <div className="hidden md:block">
                    <ProfileButton user={user} onAuth={onAuth} isLoading={isLoading} />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 md:mb-10">
                <div className="shrink-0 shadow-2xl rounded-lg overflow-hidden w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-[var(--bg-surface-2)] mx-auto md:mx-0 flex items-center justify-center">
                    {playlist.id === 'liked' ? (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Heart size={64} className="text-white fill-white md:w-20 md:h-20" />
                        </div>
                    ) : playlist.cover ? (
                         <img src={playlist.cover} className="w-full h-full object-cover" alt={playlist.title} />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <Music size={64} className="text-gray-500 md:w-20 md:h-20" />
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col justify-end pb-2 text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] mb-2 line-clamp-2">{playlist.title}</h1>
                    <h2 className="text-lg md:text-xl text-[#fa233b] font-medium mb-4">{playlist.author}</h2>
                    <p className="text-[var(--text-secondary)] text-xs md:text-sm max-w-xl leading-relaxed mb-6 line-clamp-2">{playlist.description}</p>
                    
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <button 
                            onClick={() => playlist.songs && playlist.songs.length > 0 && onPlayTrack(playlist.songs[0], playlist.songs)} 
                            className="bg-[#fa233b] text-white px-8 py-3 rounded-md font-semibold text-sm hover:bg-[#d41e32] transition flex items-center gap-2"
                        >
                            <Play size={18} fill="white" /> Play
                        </button>
                        <button 
                            className="bg-[var(--bg-surface-2)] text-[#fa233b] px-8 py-3 rounded-md font-semibold text-sm hover:bg-[var(--bg-surface-3)] transition flex items-center gap-2"
                        >
                            <ArrowLeft size={18} className="rotate-180" /> Shuffle
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="mt-2">
                    {!playlist.songs || playlist.songs.length === 0 ? (
                        <div className="p-10 text-center text-[var(--text-secondary)] text-sm">No songs available.</div>
                    ) : (
                        playlist.songs.map((song, i) => (
                            <div key={song.id} onClick={() => onPlayTrack(song, playlist.songs)} className={`group flex items-center gap-4 px-4 py-3 rounded-md cursor-pointer transition-colors ${currentTrack?.id === song.id ? 'bg-[var(--bg-surface-2)]' : 'hover:bg-[var(--bg-surface-1)]'}`}>
                                <span className="w-6 text-center text-xs md:text-sm text-[var(--text-secondary)] font-medium group-hover:hidden">{i + 1}</span>
                                <span className="w-6 text-center hidden group-hover:flex items-center justify-center text-[var(--text-secondary)]"><Play size={14} fill="currentColor"/></span>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <img src={song.cover} className="w-10 h-10 rounded shadow-sm object-cover bg-[var(--bg-surface-2)]" alt="" />
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm md:text-[15px] truncate font-medium ${currentTrack?.id === song.id ? 'text-[#fa233b]' : 'text-[var(--text-primary)]'}`}>{song.title}</span>
                                        <span className="text-xs text-[var(--text-secondary)] truncate">{song.artist}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-[var(--text-secondary)] font-medium">{song.duration}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const HomeView = ({ onPlaylistClick, playlists, onPlayTrack, currentTrack, user, onAuth, isLoading }) => {
    const [trending, setTrending] = useState([]);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch(`https://itunes.apple.com/search?term=top+hits&media=music&entity=song&limit=8`);
                const data = await res.json();
                setTrending(data.results.map(mapItunesTrack));
            } catch (e) {
                console.error("Failed to fetch trending", e);
            }
        };
        fetchTrending();
    }, []);

    const genres = [
        { name: "Pop", color: "from-pink-500 to-rose-500" },
        { name: "Hip-Hop", color: "from-orange-500 to-red-500" },
        { name: "Alternative", color: "from-cyan-500 to-blue-500" },
        { name: "Rock", color: "from-purple-500 to-indigo-500" },
        { name: "Electronic", color: "from-emerald-500 to-teal-500" },
        { name: "R&B", color: "from-indigo-500 to-violet-500" }
    ];

    return (
        <div className="pb-40 md:pb-32 px-4 md:px-10 pt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] pr-12">Home</h1>
                <div className="hidden md:block">
                    <ProfileButton user={user} onAuth={onAuth} isLoading={isLoading} />
                </div>
            </div>

            <section className="mb-10">
                 <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2"><Flame size={20} className="text-[#fa233b]" fill="#fa233b" /> Trending Now</h2>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {trending.map(song => (
                        <div key={song.id} onClick={() => onPlayTrack(song, trending)} className={`flex items-center gap-3 p-2 md:p-3 rounded-lg bg-[var(--bg-surface-1)] hover:bg-[var(--bg-surface-2)] cursor-pointer transition-colors group border border-transparent hover:border-[#fa233b]/30 ${currentTrack?.id === song.id ? 'border-[#fa233b]' : ''}`}>
                            <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0">
                                <img src={song.cover} className="w-full h-full rounded-md object-cover" alt={song.title} />
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${currentTrack?.id === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}><Play size={16} fill="white" className="text-white" /></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs md:text-sm font-semibold truncate ${currentTrack?.id === song.id ? 'text-[#fa233b]' : 'text-[var(--text-primary)]'}`}>{song.title}</h4>
                                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] truncate">{song.artist}</p>
                            </div>
                        </div>
                    ))}
                 </div>
            </section>

            <section className="mb-10">
                 <div className="flex justify-between items-end mb-4"><h2 className="text-xl font-bold text-[var(--text-primary)]">Featured Mixes</h2></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.slice(0, 3).map((pl) => (
                        <div key={pl.id} onClick={() => onPlaylistClick(pl.id)} className="group cursor-pointer relative rounded-xl overflow-hidden aspect-[2/1] bg-[var(--bg-surface-2)] shadow-lg">
                            <img src={pl.cover} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt={pl.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                                <span className="text-[10px] font-bold text-[#fa233b] uppercase tracking-wider mb-1 px-2 py-1 bg-white/10 w-fit rounded backdrop-blur-sm">Exclusive</span>
                                <h3 className="text-2xl font-bold text-white">{pl.title}</h3>
                                <p className="text-gray-300 text-sm mt-1 line-clamp-1 opacity-90">{pl.description}</p>
                            </div>
                        </div>
                    ))}
                 </div>
            </section>

            <section className="mb-10">
                <div className="flex justify-between items-end mb-4"><h2 className="text-xl font-bold text-[var(--text-primary)]">Browse Genres</h2></div>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {genres.map(g => (
                        <div key={g.name} className={`h-24 rounded-lg bg-gradient-to-br ${g.color} p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform`}>
                            <span className="font-bold text-white relative z-10">{g.name}</span>
                            <Disc className="absolute -bottom-4 -right-4 text-white/20 w-16 h-16 rotate-12" />
                        </div>
                    ))}
                 </div>
            </section>

            <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Made For You</h2>
                    <button className="text-[#fa233b] text-sm font-medium hover:underline">See All</button>
                 </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8">
                    {playlists.slice(3).map((pl) => (
                        <AlbumCard key={pl.id} playlist={pl} onClick={onPlaylistClick} />
                    ))}
                </div>
            </section>
        </div>
    );
};

const SearchView = ({ onPlayTrack, currentTrack, user, onAuth, isLoading }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if(!query) return;
        setSearching(true);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`);
            const data = await res.json();
            setResults(data.results.map(mapItunesTrack));
        } catch (err) {
            console.error(err);
        }
        setSearching(false);
    };

    return (
        <div className="pb-40 md:pb-32 px-4 md:px-10 pt-4">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
                 <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] pr-12">Search</h1>
                 <div className="hidden md:block">
                    <ProfileButton user={user} onAuth={onAuth} isLoading={isLoading} />
                 </div>
            </div>
            
            <form onSubmit={handleSearch} className="mb-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for Songs, Artists, or Albums..." className="w-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] rounded-[6px] py-2 pl-10 pr-4 placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[#fa233b] transition-all text-[15px]" />
                </div>
            </form>

            {searching ? (
                <div className="text-[var(--text-secondary)] py-10">Searching Music...</div>
            ) : (
                <>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{results.length > 0 ? "Top Results" : "Browse Categories"}</h2>
                    {results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {results.map((song) => (
                                <div key={song.id} onClick={() => onPlayTrack(song, results)} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${currentTrack?.id === song.id ? 'bg-[var(--bg-surface-2)]' : 'hover:bg-[var(--bg-surface-1)]'}`}>
                                    <div className="relative w-12 h-12 rounded-[4px] overflow-hidden shrink-0">
                                        <img src={song.cover} className="w-full h-full object-cover" alt="" />
                                        {currentTrack?.id === song.id && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Volume2 size={16} className="text-[#fa233b]" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-[15px] font-medium truncate ${currentTrack?.id === song.id ? 'text-[#fa233b]' : 'text-[var(--text-primary)]'}`}>{song.title}</h4>
                                        <p className="text-[13px] text-[var(--text-secondary)] truncate">{song.artist} • {song.duration}</p>
                                    </div>
                                    <MoreHorizontal size={18} className="text-[var(--text-secondary)]" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {['Pop', 'Hip-Hop', 'Dance', 'Country', 'Rock', 'R&B'].map(genre => (
                                 <div key={genre} className="bg-[var(--bg-surface-2)] rounded-lg p-4 h-24 flex items-end font-bold text-lg text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] transition cursor-pointer">
                                     {genre}
                                 </div>
                             ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [view, setView] = useState('home'); 
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // New Global State for Player
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    // Listen for auth state changes (persisted session or new login)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true); // Mark initial check as done
    });

    // Handle environment specific token if present (overrides persistence)
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
       signInWithCustomToken(auth, __initial_auth_token);
    } else {
        // Fallback for guest mode if no token
         signInAnonymously(auth).catch(() => {});
    }

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const showToast = (message, type = 'success') => {
      setToast({ message, type });
  };

  const handleAuth = async () => {
      setAuthLoading(true);
      try {
          if (user && !user.isAnonymous) {
              await signOut(auth);
              await signInAnonymously(auth);
              showToast("Signed out successfully");
          } else {
              const provider = new GoogleAuthProvider();
              const result = await signInWithPopup(auth, provider);
              showToast(`Welcome, ${result.user.displayName}!`);
          }
      } catch (e) {
          console.error("Auth Error:", e);
          showToast("Authentication failed.", 'error');
      } finally {
          setAuthLoading(false);
      }
  };

  const handleGuest = async () => {
      setAuthLoading(true);
      try {
          await signInAnonymously(auth);
      } catch (e) {
          console.error(e);
          showToast("Guest login failed", 'error');
      } finally {
          setAuthLoading(false);
      }
  };

  // Handle Likes - Firestore Integration
  const handleLike = async (song) => {
      if (!user) {
          showToast("Please sign in to like songs", "error");
          setShowProfileModal(true); // Open modal if not logged in
          return;
      }

      const songRef = doc(db, 'artifacts', appId, 'users', user.uid, 'likedSongs', song.id.toString());
      const isLiked = likedSongs.some(s => s.id === song.id);

      try {
          if (isLiked) {
              await deleteDoc(songRef);
              showToast("Removed from Library");
          } else {
              await setDoc(songRef, { ...song, likedAt: serverTimestamp() });
              showToast("Added to Library");
          }
      } catch (e) {
          console.error("Error updating like:", e);
          showToast("Failed to update library", "error");
      }
  };

  // Sync Liked Songs
  useEffect(() => {
      if (!user) {
          setLikedSongs([]);
          return;
      }

      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'likedSongs'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const songs = snapshot.docs.map(doc => doc.data());
          setLikedSongs(songs);
      }, (error) => {
          console.error("Error fetching liked songs:", error);
      });

      return () => unsubscribe();
  }, [user]);

  // Sync User Playlists
  useEffect(() => {
      if (!user || user.isAnonymous) {
          setUserPlaylists([]);
          return;
      }

      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'playlists'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedPlaylists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserPlaylists(fetchedPlaylists);
      }, (error) => {
          console.error("Error fetching user playlists:", error);
      });

      return () => unsubscribe();
  }, [user]);

  const handleCreatePlaylist = async (name) => {
      if (!user || user.isAnonymous) return;
      try {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'playlists'), {
              title: name,
              author: user.displayName || 'User',
              songs: [],
              createdAt: serverTimestamp(),
              cover: null
          });
          showToast("Playlist created");
      } catch (e) {
          console.error("Error creating playlist:", e);
          showToast("Failed to create playlist", "error");
      }
  };

  // Data
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'playlists'));
    const unsub = onSnapshot(q, async (snap) => {
        if (snap.empty) {
             const animeRes = await fetch('https://itunes.apple.com/search?term=anime%20opening&media=music&entity=song&limit=6');
             const animeData = await animeRes.json();
             const lofiRes = await fetch('https://itunes.apple.com/search?term=ghibli%20jazz&media=music&entity=song&limit=6');
             const lofiData = await lofiRes.json();
             
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'playlists'), {
                title: "Anime Hits",
                description: "Top openings and endings.",
                cover: animeData.results[0]?.artworkUrl100?.replace('100x100','600x600'),
                author: "Music App",
                category: "J-Pop",
                songs: animeData.results.map(mapItunesTrack),
                createdAt: serverTimestamp()
             });
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'playlists'), {
                title: "Lofi Beats",
                description: "Chill vibes for studying.",
                cover: lofiData.results[0]?.artworkUrl100?.replace('100x100','600x600'),
                author: "Music App",
                category: "Chill",
                songs: lofiData.results.map(mapItunesTrack),
                createdAt: serverTimestamp()
             });
        } else {
            setPlaylists(snap.docs.map(d => ({id: d.id, ...d.data()})));
        }
    });
    return () => unsub();
  }, [user]);

  const handlePlaylistClick = (id) => setView({ type: 'playlist', id });
  
  const handlePlayTrack = (track, newQueue) => {
    if (currentTrack?.id === track.id) {
        setIsPlaying(!isPlaying);
    } else {
        setCurrentTrack(track);
        setIsPlaying(true);
        if(newQueue) setQueue(newQueue);
    }
  };

  const handleNext = () => {
      // Prioritize Queue
      if (queue.length > 0) {
          if (isShuffle) {
              // SHUFFLE LOGIC
              const randomIndex = Math.floor(Math.random() * queue.length);
              handlePlayTrack(queue[randomIndex], queue);
          } else {
              // LINEAR LOGIC
              const currentIndex = queue.findIndex(s => s.id === currentTrack?.id);
              const nextTrack = queue[(currentIndex + 1) % queue.length]; // Loop
              if(nextTrack) handlePlayTrack(nextTrack, queue);
          }
      } else if (playlists.length) {
          // Fallback to random playlist track if no specific queue
          const pl = playlists[Math.floor(Math.random() * playlists.length)];
          if (pl.songs?.length) handlePlayTrack(pl.songs[Math.floor(Math.random() * pl.songs.length)], pl.songs);
      }
  };

  const handlePrev = () => {
      if(queue.length > 0) {
          const currentIndex = queue.findIndex(s => s.id === currentTrack?.id);
          const prevTrack = queue[(currentIndex - 1 + queue.length) % queue.length];
          if(prevTrack) handlePlayTrack(prevTrack, queue);
          else {
              const t = currentTrack;
              setCurrentTrack(null);
              setTimeout(() => { setCurrentTrack(t); setIsPlaying(true); }, 50);
          }
      }
  };

  // --- Render Logic ---
  
  if (!authInitialized) {
      return (
          <div className="fixed inset-0 bg-black flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#fa233b] to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
                      <Music size={32} className="text-white" fill="white" />
                  </div>
                  <Loader2 size={24} className="text-[#fa233b] animate-spin" />
              </div>
          </div>
      );
  }

  let content;
  if (view === 'home') content = <HomeView onPlaylistClick={handlePlaylistClick} playlists={playlists} onPlayTrack={handlePlayTrack} currentTrack={currentTrack} user={user} onAuth={handleAuth} isLoading={authLoading} />;
  else if (view === 'search') content = <SearchView onPlayTrack={handlePlayTrack} currentTrack={currentTrack} user={user} onAuth={handleAuth} isLoading={authLoading} />;
  else if (view === 'radio') content = <RadioView onPlayTrack={handlePlayTrack} currentTrack={currentTrack} user={user} onAuth={handleAuth} isLoading={authLoading} />;
  else if (view === 'library') content = <LibraryView likedSongs={likedSongs} onNavigateToLiked={() => setView('liked-songs')} user={user} onAuth={handleAuth} isLoading={authLoading} userPlaylists={userPlaylists} onCreatePlaylist={() => setShowCreatePlaylistModal(true)} onNavigateToPlaylist={handlePlaylistClick} />;
  else if (view === 'liked-songs') {
      const likedPlaylist = {
          id: 'liked',
          title: 'Liked Songs',
          author: user?.displayName || 'User',
          cover: null, // DetailView handles null cover with Heart icon for 'liked' ID
          description: 'Your favorite tracks',
          songs: likedSongs
      };
      content = <DetailView playlist={likedPlaylist} onPlayTrack={handlePlayTrack} currentTrack={currentTrack} isPlaying={isPlaying} onBack={() => setView('library')} user={user} onAuth={handleAuth} isLoading={authLoading} onLike={handleLike} likedSongs={likedSongs} />;
  }
  else if (view === 'artists') content = <ArtistsView playlists={playlists} user={user} onAuth={handleAuth} isLoading={authLoading} />;
  else if (view.type === 'playlist') {
      // Search in both public playlists and user private playlists
      const pl = playlists.find(p => p.id === view.id) || userPlaylists.find(p => p.id === view.id);
      content = pl ? <DetailView playlist={pl} onPlayTrack={handlePlayTrack} currentTrack={currentTrack} isPlaying={isPlaying} onBack={() => setView('home')} user={user} onAuth={handleAuth} isLoading={authLoading} onLike={handleLike} likedSongs={likedSongs} /> : null;
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <Sidebar 
            currentView={view} 
            setView={setView} 
            isGuest={user?.isAnonymous} 
            requestLogin={() => setShowProfileModal(true)} 
            theme={theme}
            toggleTheme={toggleTheme}
        />
        
        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto bg-[var(--bg-main)]">
            <div className="max-w-7xl mx-auto h-full">
                {content}
            </div>
        </main>
      </div>

      {/* Bottom Player */}
      <PlayerBar 
        currentTrack={currentTrack} 
        isPlaying={isPlaying} 
        onPlayPause={() => setIsPlaying(!isPlaying)} 
        onNext={handleNext} 
        onPrev={handlePrev}
        onLike={handleLike}
        isLiked={currentTrack ? likedSongs.some(s => s.id === currentTrack.id) : false}
        queue={queue}
        onPlayTrack={handlePlayTrack}
        isShuffle={isShuffle}
        toggleShuffle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        toggleRepeat={() => setIsRepeat(!isRepeat)}
      />
      
      {/* Toast Notification */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      
      {/* Mobile Bottom Navigation */}
      <BottomNav 
        currentView={view} 
        setView={setView} 
        openProfile={() => setShowProfileModal(true)} 
        isGuest={user?.isAnonymous}
        requestLogin={() => setShowProfileModal(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      {/* Profile Modal (Used on Mobile & Desktop Trigger) */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        user={user} 
        onAuth={handleAuth} 
        isLoading={authLoading} 
      />

      <CreatePlaylistModal 
        isOpen={showCreatePlaylistModal}
        onClose={() => setShowCreatePlaylistModal(false)}
        onCreate={handleCreatePlaylist}
      />

      <style>{`
        :root {
            --bg-main: ${theme === 'dark' ? '#000000' : '#ffffff'};
            --bg-sidebar: ${theme === 'dark' ? '#121212' : '#f2f2f2'};
            --bg-surface-1: ${theme === 'dark' ? '#1c1c1e' : '#e6e6e6'};
            --bg-surface-2: ${theme === 'dark' ? '#2c2c2e' : '#d9d9d9'};
            --bg-surface-3: ${theme === 'dark' ? '#3a3a3c' : '#cccccc'};
            --text-primary: ${theme === 'dark' ? '#ffffff' : '#000000'};
            --text-secondary: ${theme === 'dark' ? '#9ca3af' : '#4b5563'};
            --border: ${theme === 'dark' ? '#2c2c2e' : '#d9d9d9'};
        }

        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; border: 2px solid #000; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }

        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up-sm { animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-zoom-in { animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;