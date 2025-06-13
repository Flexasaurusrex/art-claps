'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface Artist {
  id: string;
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  verifiedArtist: boolean;
  claps: number;
  totalActivities: number;
  connections: number;
  alreadyClappedToday: boolean;
}

interface UserStats {
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  supportGiven: number;
  supportReceived: number;
}

export default function DiscoverPage() {
  const { isAuthenticated, profile, isLoading: authLoading, refreshAuth } = useAuth();
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<{[key: number]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userRole, setUserRole] = useState<'supporter' | 'verified_artist' | 'admin'>('supporter');
  const [syncingFarcaster, setSyncingFarcaster] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is admin (FID 7418)
  const isAdmin = profile?.fid === 7418;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize user and fetch data when authenticated
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && profile) {
        initializeUser();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, profile, authLoading]);

  // DEBUG: Log auth state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      isAuthenticated, 
      profileUsername: profile?.username,
      profileFid: profile?.fid,
      authLoading,
      hasProfile: !!profile,
      profileKeys: profile ? Object.keys(profile) : 'no profile'
    });
  }, [isAuthenticated, profile, authLoading]);

  // Refresh auth on page load
  useEffect(() => {
    refreshAuth();
  }, []);

  const initializeUser = async () => {
    if (!profile?.fid) {
      console.log('No profile.fid available, skipping initializeUser');
      setIsLoading(false);
      return;
    }
    
    try {
      // Register/update user in database
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farcasterFid: profile.fid,
          username: profile.username,
          displayName: profile.displayName,
          pfpUrl: profile.pfpUrl,
          bio: profile.bio
        })
      });

      // Fetch user stats and determine role
      await fetchUserStats();
      
      // Fetch artists
      await fetchArtists();
      
    } catch (error) {
      console.error('Error initializing user:', error);
      setError('Failed to initialize user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFarcaster = async () => {
    if (!profile?.fid || syncingFarcaster) return;

    setSyncingFarcaster(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/sync-farcaster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userFid: profile.fid
        })
      });

      const result = await response.json();

      if (result.success) {
        setSyncMessage(result.message);
        
        // Refresh user stats and artists if activities were found
        if (result.activitiesDetected > 0) {
          await fetchUserStats();
          await fetchArtists();
        }
        
        // Clear message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        setSyncMessage(result.error || 'Failed to sync activities');
      }
    } catch (error) {
      console.error('Error syncing Farcaster activities:', error);
      setSyncMessage('Failed to sync activities. Please try again.');
    } finally {
      setSyncingFarcaster(false);
    }
  };

  const fetchUserStats = async () => {
    if (!profile?.fid) {
      console.log('No profile.fid available, skipping fetchUserStats');
      return;
    }
    
    try {
      const response = await fetch(`/api/user?fid=${profile.fid}`);
      const data = await response.json();
      
      if (data.success) {
        setUserStats({
          totalPoints: data.user.totalPoints,
          weeklyPoints: data.user.weeklyPoints,
          monthlyPoints: data.user.monthlyPoints,
          supportGiven: data.user.supportGiven,
          supportReceived: data.user.supportReceived
        });

        // Determine user role - check admin first with current profile FID
        if (profile.fid === 7418) {
          setUserRole('admin');
        } else if (data.user.artistStatus === 'verified_artist') {
          setUserRole('verified_artist');
        } else {
          setUserRole('supporter');
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchArtists = async () => {
    if (!profile?.fid) {
      console.log('No profile.fid available, skipping fetchArtists');
      return;
    }
    
    try {
      const response = await fetch(`/api/artists?limit=20&currentUserFid=${profile.fid}`);
      const data = await response.json();
      
      if (data.success) {
        setArtists(data.artists);
      } else {
        setError('Failed to fetch artists');
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      setError('Failed to fetch artists');
    }
  };

  const handleClap = async (artistFid: number) => {
    if (!isAuthenticated || !profile) return;
    
    setLoading(prev => ({ ...prev, [artistFid]: true }));
    
    try {
      const response = await fetch('/api/clap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFid: profile.fid,
          targetFid: artistFid
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local artist state
        setArtists(prev => prev.map(artist => 
          artist.fid === artistFid 
            ? { 
                ...artist, 
                claps: artist.claps + 1,
                alreadyClappedToday: true 
              }
            : artist
        ));

        // Update user stats
        if (userStats) {
          setUserStats(prev => prev ? {
            ...prev,
            totalPoints: data.newTotalPoints,
            weeklyPoints: prev.weeklyPoints + 5,
            monthlyPoints: prev.monthlyPoints + 5,
            supportGiven: prev.supportGiven + 1
          } : null);
        }

      } else {
        alert(data.error || 'Failed to record clap');
      }
    } catch (error) {
      console.error('Error clapping:', error);
      alert('Failed to record clap. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [artistFid]: false }));
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl px-4">
        Loading Art Claps... 🎨
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white text-center p-4">
        <div className="text-4xl mb-8">🔐</div>
        <div className="text-xl mb-8 max-w-md">Please sign in to discover artists</div>
        <a 
          href="/"
          className="bg-white/20 border border-white/30 rounded-xl px-6 py-3 text-white no-underline hover:bg-white/30 transition-colors"
        >
          ← Back to Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      {/* Header with User Stats */}
      <header className="p-4 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-2xl lg:text-3xl font-bold text-white">
          <a href="/" className="text-white no-underline">
            Art Claps
          </a>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* User Stats Display */}
          {userStats && (
            <div className="bg-white/10 rounded-xl p-3 lg:p-4 flex gap-4 lg:gap-6 backdrop-blur-sm w-full sm:w-auto">
              <div className="text-center">
                <div className="text-lg lg:text-xl font-bold text-white">
                  {userStats.totalPoints.toLocaleString()}
                </div>
                <div className="text-xs lg:text-sm text-white/70">
                  Total CLAPS
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg lg:text-xl font-bold text-white">
                  {userStats.weeklyPoints}
                </div>
                <div className="text-xs lg:text-sm text-white/70">
                  This Week
                </div>
              </div>
            </div>
          )}
          
          {/* User Profile with Dropdown */}
          <div className="relative">
            <div 
              className="flex items-center gap-2 lg:gap-3 cursor-pointer p-2 rounded-xl transition-colors hover:bg-white/10"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <img 
                src={profile.pfpUrl} 
                alt={profile.displayName}
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white/30"
              />
              <div className="text-white hidden sm:block">
                <div className="font-semibold text-sm lg:text-base">{profile.displayName}</div>
                <div className="text-xs lg:text-sm opacity-80">@{profile.username}</div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
                className={`transition-transform ${showProfileDropdown ? 'rotate-180' : 'rotate-0'}`}
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full right-0 mt-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 min-w-[200px] z-50 shadow-2xl"
              >
                {/* User Info Header */}
                <div className="border-b border-white/20 pb-4 mb-4">
                  <div className="text-white font-semibold mb-1">
                    {profile?.displayName}
                  </div>
                  <div className="text-white/70 text-sm mb-2">
                    @{profile?.username}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold border ${
                    userRole === 'admin' 
                      ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                      : userRole === 'verified_artist'
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  }`}>
                    {userRole === 'admin' ? '👑 Admin' : 
                     userRole === 'verified_artist' ? '✓ Verified Artist' : 
                     '💎 Supporter'}
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-2">
                  
                  {/* Admin Panel - Only for admins */}
                  {userRole === 'admin' && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="flex items-center gap-3 text-white bg-transparent border-none p-3 rounded-xl transition-colors w-full text-left hover:bg-white/10"
                    >
                      <span>👑</span>
                      <span>Admin Panel</span>
                    </button>
                  )}

                  {/* Referral Codes */}
                  <button
                    onClick={() => router.push('/referral-codes')}
                    className="flex items-center gap-3 text-white bg-transparent border-none p-3 rounded-xl transition-colors w-full text-left hover:bg-white/10"
                  >
                    <span>🎟️</span>
                    <span>Referral Codes</span>
                  </button>

                  <div className="h-px bg-white/20 my-2" />

                  {/* Home */}
                  <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-3 text-white bg-transparent border-none p-3 rounded-xl transition-colors w-full text-left hover:bg-white/10"
                  >
                    <span>🏠</span>
                    <span>Home</span>
                  </button>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    className="flex items-center gap-3 text-white/80 bg-transparent border-none p-3 rounded-xl transition-colors w-full text-left hover:bg-white/10"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 text-center">
            🎨 Discover Artists
          </h1>
          
          <p className="text-lg lg:text-xl text-white/80 text-center mb-4 max-w-3xl mx-auto">
            Support amazing Farcaster artists and earn CLAPS points for genuine engagement
          </p>

          {/* Sync Farcaster Activity Button */}
          <div className="text-center mb-8 lg:mb-12">
            <button
              onClick={handleSyncFarcaster}
              disabled={syncingFarcaster}
              className={`inline-flex items-center gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold transition-all text-white border-none shadow-lg ${
                syncingFarcaster
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 cursor-pointer'
              }`}
            >
              {syncingFarcaster ? (
                <>
                  <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span className="hidden sm:inline">Sync My Farcaster Activity</span>
                  <span className="sm:hidden">Sync Activity</span>
                </>
              )}
            </button>
          </div>

          {/* Apply to be Artist CTA - Only show for supporters */}
          {userRole === 'supporter' && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl lg:rounded-3xl p-6 lg:p-8 mb-8 lg:mb-12 text-center">
              <div className="text-4xl lg:text-5xl mb-4">🎨</div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
                Are you an artist?
              </h2>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                Join our community of verified Farcaster artists and get discovered by supporters who want to help you grow.
              </p>
              <button
                onClick={() => router.push('/apply')}
                className="inline-flex items-center gap-2 lg:gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold px-6 lg:px-8 py-3 lg:py-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 hover:scale-105 text-sm sm:text-base lg:text-lg border-none cursor-pointer shadow-lg"
              >
                <span>🎯</span>
                <span>Apply to be a Verified Artist</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}

          {/* Sync Message */}
          {syncMessage && (
            <div className={`text-center mb-6 lg:mb-8 p-3 lg:p-4 rounded-xl mx-4 ${
              syncMessage.includes('Failed') || syncMessage.includes('Error')
                ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                : 'bg-green-500/20 border border-green-500/30 text-green-300'
            }`}>
              {syncMessage}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-white text-center mb-6 lg:mb-8 mx-4">
              {error}
            </div>
          )}

          {/* Artists Grid */}
          {artists.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {artists.map((artist) => (
                <div
                  key={artist.fid}
                  className={`bg-white/10 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-4 lg:p-6 transition-transform hover:-translate-y-1 relative ${
                    artist.verifiedArtist 
                      ? 'border-2 border-green-500/50' 
                      : 'border border-white/20'
                  }`}
                >
                  {/* Verified Badge */}
                  {artist.verifiedArtist && (
                    <div className="absolute top-3 lg:top-4 right-3 lg:right-4 bg-green-500/20 border border-green-500/50 rounded-full px-2 lg:px-3 py-1 text-xs lg:text-sm text-green-400 font-semibold">
                      ✓ Verified
                    </div>
                  )}

                  {/* Artist Header */}
                  <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                    <img
                      src={artist.pfpUrl}
                      alt={artist.displayName}
                      className="w-12 h-12 lg:w-16 lg:h-16 rounded-full border-2 lg:border-3 border-white/30"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-lg lg:text-xl font-bold mb-1 truncate">
                        {artist.displayName}
                      </h3>
                      <p className="text-white/70 text-sm lg:text-base truncate">
                        @{artist.username}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-white/80 text-sm lg:text-base line-clamp-3 mb-4 lg:mb-6 leading-relaxed">
                    {artist.bio}
                  </p>

                  {/* Stats */}
                  <div className="flex justify-around mb-4 lg:mb-6">
                    <div className="text-center">
                      <div className="text-white text-lg lg:text-xl font-bold">
                        {artist.claps.toLocaleString()}
                      </div>
                      <div className="text-white/60 text-xs lg:text-sm">
                        Claps
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-white text-lg lg:text-xl font-bold">
                        {artist.connections}
                      </div>
                      <div className="text-white/60 text-xs lg:text-sm">
                        Connections
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                    <button
                      onClick={() => handleClap(artist.fid)}
                      disabled={loading[artist.fid] || artist.alreadyClappedToday}
                      className={`flex-1 px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-semibold transition-all border-none ${
                        artist.alreadyClappedToday
                          ? 'bg-green-500/30 text-green-300 cursor-not-allowed' 
                          : loading[artist.fid]
                          ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 cursor-pointer'
                      }`}
                    >
                      {loading[artist.fid] ? '👏 Clapping...' : 
                       artist.alreadyClappedToday ? '✅ Clapped!' : 
                       '👏 Clap (+5)'}
                    </button>

                    <button
                      onClick={() => router.push(`/artist/${artist.username}`)}
                      className="flex-shrink-0 px-3 lg:px-4 py-2 lg:py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm lg:text-base font-medium cursor-pointer transition-all hover:bg-white/20 hover:border-white/30"
                    >
                      👤 Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/80 text-lg lg:text-xl py-16">
              No artists found. Check back soon!
            </div>
          )}
        </div>
      </main>

      {/* Add spinning animation */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
