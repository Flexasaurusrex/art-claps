'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ArtistLink {
  platform: string;
  url: string;
  label: string;
}

interface Artist {
  id: string;
  farcasterFid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  verifiedArtist: boolean;
  claps: number;
  totalActivities: number;
  connections: number;
  supportReceived: number;
  joinedDate: string;
  artistLinks?: ArtistLink[];
  extendedBio?: string;
}

interface UserStats {
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  supportGiven: number;
  supportReceived: number;
}

export default function ArtistProfilePage() {
  const { isAuthenticated, profile } = useProfile();
  const params = useParams();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [clapLoading, setClapLoading] = useState(false);
  const [alreadyClappedToday, setAlreadyClappedToday] = useState(false);

  const username = params.username as string;

  useEffect(() => {
    if (username) {
      fetchArtistProfile();
    }
  }, [username]);

  useEffect(() => {
    if (isAuthenticated && profile) {
      fetchUserStats();
    }
  }, [isAuthenticated, profile]);

  const fetchArtistProfile = async () => {
    try {
      const response = await fetch(`/api/artist/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setArtist(data.artist);
        setAlreadyClappedToday(data.alreadyClappedToday || false);
      } else {
        // Artist not found, redirect to discover
        router.push('/discover');
      }
    } catch (error) {
      console.error('Error fetching artist profile:', error);
    } finally {
      setLoading(false);
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
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleClap = async () => {
    if (!isAuthenticated || !profile || !artist || clapLoading || alreadyClappedToday) return;
    
    setClapLoading(true);
    
    try {
      const response = await fetch('/api/clap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFid: profile.fid,
          targetFid: artist.farcasterFid
        })
      });

      const data = await response.json();

      if (data.success) {
        setArtist(prev => prev ? { ...prev, claps: prev.claps + 1 } : null);
        setAlreadyClappedToday(true);
        
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
        alert(data.error || 'Failed to clap');
      }
    } catch (error) {
      console.error('Error clapping:', error);
      alert('Failed to clap. Please try again.');
    } finally {
      setClapLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      website: '🌐',
      portfolio: '🎨',
      twitter: '🐦',
      instagram: '📸',
      opensea: '🌊',
      foundation: '🏛️',
      superrare: '💎',
      spotify: '🎵',
      soundcloud: '🎶',
      linkedin: '💼',
      github: '💻',
      discord: '💬',
      telegram: '📱',
      ens: '🌈',
      custom: '🔗'
    };
    return icons[platform.toLowerCase()] || '🔗';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading artist profile...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl mb-4">Artist not found</h1>
          <Link href="/discover" className="text-purple-300 hover:text-purple-100">
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/discover" className="text-white hover:text-purple-200 transition-colors">
            ← Back to Discover
          </Link>
          
          {userStats && (
            <div className="bg-purple-600/30 text-purple-200 px-3 py-1 rounded-full text-sm">
              {userStats.totalPoints} CLAPS
            </div>
          )}
        </div>
      </header>

      {/* Artist Profile */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Artist Header */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center text-center md:text-left">
              <img
                src={artist.pfpUrl}
                alt={artist.displayName}
                className="w-32 h-32 rounded-full border-4 border-purple-400 mb-4"
              />
              
              {artist.verifiedArtist && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1 text-green-400 text-sm font-medium mb-4">
                  ✓ Verified Artist
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClap}
                  disabled={clapLoading || alreadyClappedToday || !isAuthenticated}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    alreadyClappedToday
                      ? 'bg-green-500/30 text-green-300 cursor-not-allowed'
                      : clapLoading
                      ? 'bg-gray-500 cursor-not-allowed'
                      : !isAuthenticated
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white'
                  }`}
                >
                  {clapLoading ? '👏 Clapping...' : 
                   alreadyClappedToday ? '✅ Clapped Today!' : 
                   !isAuthenticated ? '🔐 Sign In to Clap' :
                   '👏 Clap (+5)'}
                </button>
              </div>
            </div>

            {/* Artist Details */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{artist.displayName}</h1>
              <p className="text-xl text-purple-200 mb-4">@{artist.username}</p>
              
              {/* Bio */}
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                {artist.extendedBio || artist.bio}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{artist.claps.toLocaleString()}</div>
                  <div className="text-sm text-white/60">Claps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{artist.connections}</div>
                  <div className="text-sm text-white/60">Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{artist.supportReceived}</div>
                  <div className="text-sm text-white/60">Supporters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{artist.totalActivities}</div>
                  <div className="text-sm text-white/60">Activities</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Links Section */}
        {artist.artistLinks && artist.artistLinks.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🔗 Links & Socials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artist.artistLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-4 transition-all duration-200 hover:scale-105"
                >
                  <span className="text-2xl">{getPlatformIcon(link.platform)}</span>
                  <div>
                    <div className="text-white font-medium">{link.label}</div>
                    <div className="text-white/60 text-sm capitalize">{link.platform}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Preview */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">📈 Artist Activity</h2>
          <div className="text-center text-white/60 py-8">
            <p>Activity feed coming soon...</p>
            <p className="text-sm mt-2">This will show recent claps, interactions, and highlights</p>
          </div>
        </div>
      </main>
    </div>
  );
}
