import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { MeetingAlert } from './MeetingAlert';
import { Menu, Bell, Search, User, LogOut, Maximize2, Minimize2, Circle, Wallet, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useInboxView } from '@/contexts/InboxViewContext';
import { meetingApi, employeeApi } from '@/lib/api';
import { workSessionApi } from '@/lib/workSession';
import { activityTracker } from '@/lib/activityTracker';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();
  const { hideMainSidebar } = useInboxView();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBalancePopup, setShowBalancePopup] = useState(false);
  const [showActivationPopup, setShowActivationPopup] = useState(false);
  const { user, logout } = useAuth();

  const queryClient = useQueryClient();

  // Fetch balance and points for employees (not clients or SuperAdmin viewing other employees)
  const { data: balanceData } = useQuery({
    queryKey: ['my-balance-points'],
    queryFn: async () => {
      const response = await employeeApi.getMyBalancePoints();
      return response.data.data;
    },
    enabled: !!user?.id && user?.roleName !== 'Client',
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch upcoming meeting (within 1 hour)
  const { data: upcomingMeeting } = useQuery({
    queryKey: ['upcoming-meeting', user?.id, user?.companyId],
    queryFn: async () => {
      const response = await meetingApi.getUpcoming();
      return response.data.data;
    },
    enabled: !!user?.id && !!user?.companyId,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Work session (live) status - for employees
  const { data: sessionStatus } = useQuery({
    queryKey: ['work-session-status'],
    queryFn: () => workSessionApi.getCurrentSession(),
    refetchInterval: 30000,
    enabled: !!user?.id && user?.roleName !== 'Client',
  });

  const toggleLiveMutation = useMutation({
    mutationFn: () => workSessionApi.toggleLiveStatus(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-session-status'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      setShowActivationPopup(false);
    },
  });

  // Activity tracker: start when online, stop when offline (employees only)
  useEffect(() => {
    if (!user?.id || user?.roleName === 'Client') return;
    if (sessionStatus?.isOnline === true) {
      const sessionId = sessionStatus?.session?.id ?? null;
      activityTracker.start(sessionId);
      return () => activityTracker.stop();
    }
    activityTracker.stop();
  }, [user?.id, user?.roleName, sessionStatus?.isOnline, sessionStatus?.session?.id]);

  // Show activation popup on first load when user is offline (not Client)
  useEffect(() => {
    if (
      user?.id &&
      user?.roleName !== 'Client' &&
      sessionStatus !== undefined &&
      sessionStatus?.isOnline === false &&
      !sessionStorage.getItem('activation_shown')
    ) {
      setShowActivationPopup(true);
    }
  }, [user?.id, user?.roleName, sessionStatus]);

  const handleActivationLater = () => {
    sessionStorage.setItem('activation_shown', 'true');
    setShowActivationPopup(false);
  };

  const handleActivationActivate = () => {
    toggleLiveMutation.mutate();
    sessionStorage.setItem('activation_shown', 'true');
  };

  // Hide main sidebar only when on /inbox AND a chat is selected; keep inbox tabs/conversation list visible
  useEffect(() => {
    if (location.pathname === '/inbox') {
      setIsOpen(!hideMainSidebar);
    } else {
      setIsOpen(true);
    }
  }, [location.pathname, hideMainSidebar, setIsOpen]);

  // Check fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) {
          await (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content area */}
      <div className={cn(
        "transition-all duration-300",
        isOpen ? "lg:pl-64" : "lg:pl-0"
      )}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            {/* Left: Menu button */}
            {/* Show on mobile always, or on desktop when sidebar is hidden and on /inbox */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "p-2 hover:bg-gray-100 rounded-md transition-colors",
                location.pathname === '/inbox' && !isOpen ? "" : "lg:hidden"
              )}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Search bar - hidden on mobile, visible on md+ */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Meeting Alert (before fullscreen button) */}
              {upcomingMeeting && (
                <MeetingAlert meeting={upcomingMeeting} />
              )}

              {/* Live status button - for employees */}
              {user?.roleName !== 'Client' && (
                <button
                  onClick={() => toggleLiveMutation.mutate()}
                  disabled={toggleLiveMutation.isPending}
                  className={cn(
                    'flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-full transition-all',
                    sessionStatus?.isOnline
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  )}
                  title={sessionStatus?.isOnline ? 'Live - receiving messages' : 'Offline - go live to receive messages'}
                >
                  <Circle className={cn('w-2 h-2', sessionStatus?.isOnline && 'fill-current')} />
                  <span className="hidden sm:inline">{sessionStatus?.isOnline ? 'Live' : 'Offline'}</span>
                </button>
              )}

              {/* Balance & Points button - for employees */}
              {user?.roleName !== 'Client' && user?.roleName !== 'SuperAdmin' && (
                <button
                  onClick={() => setShowBalancePopup(true)}
                  className="flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-all"
                  title="ব্যালেন্স ও পয়েন্ট দেখুন"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">ব্যালেন্স</span>
                </button>
              )}

              {/* Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-slate-600" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {/* Notifications */}
              <button
                className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.email}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-slate-700">
                    {user?.email || 'User'}
                  </span>
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                          <p className="text-xs text-slate-500">{user?.roleName || 'User'}</p>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Activation Popup - show when user is offline after login */}
      {showActivationPopup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 sm:p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                  <Circle className="w-8 h-8 text-green-600 fill-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                আপনার প্যানেল একটিভ করুন
              </h2>
              <p className="text-slate-600 text-sm mb-1">
                আপনার কাজের সময় তখন থেকে গণনা হবে যখন আপনি একটিভ করবেন।
              </p>
              <p className="text-slate-500 text-xs mb-6">
                Your work time starts counting when you activate your panel.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleActivationActivate}
                  disabled={toggleLiveMutation.isPending}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors shadow-md"
                >
                  {toggleLiveMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      একটিভ করা হচ্ছে...
                    </span>
                  ) : (
                    'একটিভ করুন (Go Active)'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleActivationLater}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  পরে করব (Later)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance & Points Popup */}
      {showBalancePopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                ব্যালেন্স ও পয়েন্ট
              </h2>
              <button
                onClick={() => setShowBalancePopup(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Points Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">পয়েন্ট</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs text-amber-600 mb-1">রিজার্ভ পয়েন্ট</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {balanceData?.reservePoints?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 mb-1">মেইন পয়েন্ট</p>
                    <p className="text-2xl font-bold text-green-700">
                      {balanceData?.mainPoints?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Balance Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">ব্যালেন্স</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-1">রিজার্ভ ব্যালেন্স</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ৳{balanceData?.reserveBalance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-xs text-indigo-600 mb-1">মেইন ব্যালেন্স</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      ৳{balanceData?.mainBalance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-slate-600">
                <p><strong>রিজার্ভ পয়েন্ট:</strong> লিড তৈরি করলে প্রোডাক্টের লিড পয়েন্ট এখানে যোগ হয়।</p>
                <p className="mt-1"><strong>মেইন পয়েন্ট:</strong> লিড সম্পন্ন (Won) হলে রিজার্ভ থেকে এখানে ট্রান্সফার হয়।</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowBalancePopup(false)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

