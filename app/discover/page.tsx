'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '@farcaster/auth-kit';

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
  const { isAuthenticated, profile } = useProfile();
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
    if (isAuthenticated && profile) {
      initializeUser();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile]);

  const initializeUser = async () => {
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

        // Determine user role
        if (isAdmin) {
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

  const ProfileDropdown = () => (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: '0',
        marginTop: '0.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '1rem',
        minWidth: '200px',
        zIndex: 50
      }}
    >
      {/* User Info Header */}
      <div style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          color: 'white',
          fontWeight: '600',
          marginBottom: '0.25rem'
        }}>
          {profile?.displayName}
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.9rem',
          marginBottom: '0.5rem'
        }}>
          @{profile?.username}
        </div>
        <div style={{
          display: 'inline-block',
          background: userRole === 'admin' 
            ? 'rgba(239, 68, 68, 0.2)' 
            : userRole === 'verified_artist'
            ? 'rgba(34, 197, 94, 0.2)'
            : 'rgba(59, 130, 246, 0.2)',
          border: `1px solid ${userRole === 'admin' 
            ? 'rgba(239, 68, 68, 0.5)' 
            : userRole === 'verified_artist'
            ? 'rgba(34, 197, 94, 0.5)'
            : 'rgba(59, 130, 246, 0.5)'}`,
          borderRadius: '12px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.8rem',
          color: userRole === 'admin' 
            ? 'rgb(239, 68, 68)' 
            : userRole === 'verified_artist'
            ? 'rgb(34, 197, 94)'
            : 'rgb(59, 130, 246)',
          fontWeight: '600'
        }}>
          {userRole === 'admin' ? '👑 Admin' : 
           userRole === 'verified_artist' ? '✓ Verified Artist' : 
           '💎 Supporter'}
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        
        {/* Admin Panel - Only for admins */}
        {userRole === 'admin' && (
          <a
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'white',
              textDecoration: 'none',
              padding: '0.75rem',
              borderRadius: '12px',
              transition: 'background 0.2s ease',
              fontSize: '0.95rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>👑</span>
            <span>Admin Panel</span>
          </a>
        )}

        {/* Referral Codes - Now available for all users */}
        <a
          href="/referral-codes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'white',
            textDecoration: 'none',
            padding: '0.75rem',
            borderRadius: '12px',
            transition: 'background 0.2s ease',
            fontSize: '0.95rem'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span>🎟️</span>
          <span>Referral Codes</span>
        </a>

        {/* Apply to be Artist - Only for supporters, no blocking alert */}
        {userRole === 'supporter' && (
          <a
            href="/apply"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'white',
              textDecoration: 'none',
              padding: '0.75rem',
              borderRadius: '12px',
              transition: 'background 0.2s ease',
              fontSize: '0.95rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>🎨</span>
            <span>Apply to be Artist</span>
          </a>
        )}

        <div style={{
          height: '1px',
          background: 'rgba(255, 255, 255, 0.2)',
          margin: '0.5rem 0'
        }} />

        {/* Home */}
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'white',
            textDecoration: 'none',
            padding: '0.75rem',
            borderRadius: '12px',
            transition: 'background 0.2s ease',
            fontSize: '0.95rem'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span>🏠</span>
          <span>Home</span>
        </a>

        {/* Sign Out */}
        <button
          onClick={() => {
            // Add sign out logic here if needed
            window.location.href = '/';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            background: 'transparent',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '12px',
            transition: 'background 0.2s ease',
            fontSize: '0.95rem',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Loading Art Claps... 🎨
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>🔐</div>
        <div style={{ marginBottom: '2rem' }}>Please sign in to discover artists</div>
        <a 
          href="/"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '1rem 2rem',
            color: 'white',
            textDecoration: 'none',
            fontSize: '1rem'
          }}
        >
          ← Back to Sign In
        </a>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header with User Stats */}
      <header style={{
        padding: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'white'
        }}>
          <a href="/" style={{ color: 'white', textDecoration: 'none' }}>
            Art Claps
          </a>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* User Stats Display */}
          {userStats && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>
                  {userStats.totalPoints.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                  Total CLAPS
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>
                  {userStats.weeklyPoints}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                  This Week
                </div>
              </div>
            </div>
          )}
          
          {/* User Profile with Dropdown */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '12px',
                transition: 'background 0.2s ease'
              }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseOut={(e) => {
                if (!showProfileDropdown) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <img 
                src={profile.pfpUrl} 
                alt={profile.displayName}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              />
              <div style={{ color: 'white' }}>
                <div style={{ fontWeight: '600' }}>{profile.displayName}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>@{profile.username}</div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
                style={{
                  transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>

            {/* Dropdown Menu */}
            {showProfileDropdown && <ProfileDropdown />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '0 2rem 4rem 2rem' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            color: 'white',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            🎨 Discover Artists
          </h1>
          
          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem auto'
          }}>
            Support amazing Farcaster artists and earn CLAPS points for genuine engagement
          </p>

          {/* Error Display */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              color: 'white',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              {error}
            </div>
          )}

          {/* Artists Grid */}
          {artists.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {artists.map((artist) => (
                <div
                  key={artist.fid}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: artist.verifiedArtist 
                      ? '2px solid rgba(34, 197, 94, 0.5)' 
                      : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    padding: '2rem',
                    transition: 'transform 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Verified Badge */}
                  {artist.verifiedArtist && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      borderRadius: '20px',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.8rem',
                      color: 'rgb(34, 197, 94)',
                      fontWeight: '600'
                    }}>
                      ✓ Verified Artist
                    </div>
                  )}

                  {/* Artist Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <img
                      src={artist.pfpUrl}
                      alt={artist.displayName}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255, 255, 255, 0.3)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: 'white',
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        marginBottom: '0.25rem'
                      }}>
                        {artist.displayName}
                      </h3>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '1rem'
                      }}>
                        @{artist.username}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: '1.5',
                    marginBottom: '1.5rem'
                  }}>
                    {artist.bio}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '2rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: '700'
                      }}>
                        {artist.claps.toLocaleString()}
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.9rem'
                      }}>
                        Claps
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: '700'
                      }}>
                        {artist.connections}
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.9rem'
                      }}>
                        Connections
                      </div>
                    </div>
                  </div>

                  {/* Clap Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClap(artist.fid)}
                      disabled={loading[artist.fid] || artist.alreadyClappedToday}
                      className={`flex-1 ${
                        artist.alreadyClappedToday
                          ? 'bg-rgba(34, 197, 94, 0.3)' 
                          : 'bg-linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
                      } border-none rounded-xl py-3 px-4 text-white text-lg font-semibold cursor-${
                        loading[artist.fid] || artist.alreadyClappedToday ? 'not-allowed' : 'pointer'
                      } opacity-${
                        loading[artist.fid] || artist.alreadyClappedToday ? '70' : '100'
                      } transition-all duration-300ms ease`}
                      style={{
                        background: artist.alreadyClappedToday
                          ? 'rgba(34, 197, 94, 0.3)' 
                          : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                        cursor: loading[artist.fid] || artist.alreadyClappedToday ? 'not-allowed' : 'pointer',
                        opacity: loading[artist.fid] || artist.alreadyClappedToday ? 0.7 : 1
                      }}
                    >
                      {loading[artist.fid] ? '👏 Clapping...' : 
                       artist.alreadyClappedToday ? '✅ Clapped Today!' : 
                       '👏 Clap for Artist (+5 CLAPS)'}
                    </button>

                    <a
                      href={`/artist/${artist.username}`}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl py-3 px-4 text-white text-center font-medium transition-all duration-300ms ease hover:scale-105"
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '120px'
                      }}
                    >
                      👤 Profile
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.2rem',
              padding: '4rem 2rem'
            }}>
              No artists found. Check back soon!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
