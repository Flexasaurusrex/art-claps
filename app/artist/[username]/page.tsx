'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  artistLinks?: any[];
  extendedBio?: string;
}

export default function ArtistProfilePage() {
  const { isAuthenticated, profile } = useProfile();
  const params = useParams();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  const username = params.username as string;

  useEffect(() => {
    if (username) {
      fetchArtistProfile();
    }
  }, [username]);

  // Check auth status and try to persist
  useEffect(() => {
    const checkAuth = () => {
      // Force re-check auth status on page load
      if (!isAuthenticated && typeof window !== 'undefined') {
        // Small delay to let auth provider initialize
        setTimeout(() => {
          if (!isAuthenticated) {
            console.log('Auth not detected on profile page');
          }
        }, 1000);
      }
    };
    checkAuth();
  }, [isAuthenticated]);

  const fetchArtistProfile = async () => {
    try {
      const response = await fetch(`/api/artist?username=${username}`);
      const data = await response.json();
      
      if (data.success) {
        setArtist(data.artist);
      } else {
        router.push('/discover');
      }
    } catch (error) {
      console.error('Error fetching artist profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center px-4">
        <div className="text-white text-lg lg:text-xl">Loading artist profile...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center px-4">
        <div className="text-center text-white">
          <h1 className="text-xl lg:text-2xl mb-4">Artist not found</h1>
          <Link href="/discover" className="text-purple-200 hover:text-purple-100 transition-colors">
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 lg:py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/discover')}
            className="text-white hover:text-purple-200 transition-colors cursor-pointer bg-transparent border-none text-sm lg:text-base flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="hidden sm:inline">Back to Discover</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          {/* Home link */}
          <Link href="/" className="text-white hover:text-purple-200 transition-colors text-sm lg:text-base">
            Art Claps
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-12">
        
        {/* Artist Profile Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
            
            {/* Profile Picture & Verification */}
            <div className="flex flex-col items-center text-center flex-shrink-0">
              <img
                src={artist.pfpUrl}
                alt={artist.displayName}
                className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full border-4 border-purple-400 mb-4 shadow-lg"
              />
              
              {artist.verifiedArtist && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1 text-green-400 text-xs sm:text-sm font-semibold mb-2">
                  ✓ Verified Artist
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="flex-1 text-center lg:text-left w-full">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 break-words">
                {artist.displayName}
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-purple-200 mb-4 lg:mb-6">
                @{artist.username}
              </p>
              
              <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 lg:mb-8 max-w-2xl mx-auto lg:mx-0">
                {artist.extendedBio || artist.bio}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div className="text-center bg-white/5 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {artist.claps.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-white/60">
                    Claps
                  </div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {artist.connections.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-white/60">
                    Connections
                  </div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {artist.supportReceived.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-white/60">
                    Supporters
                  </div>
                </div>
                <div className="text-center bg-white/5 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {artist.totalActivities.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-white/60">
                    Activities
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 lg:mb-8">
          <button 
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            onClick={() => {
              // Add clapping functionality here
              console.log('Clap for artist');
            }}
          >
            👏 Clap for {artist.displayName}
          </button>
          
          <button 
            className="flex-1 bg-white/10 border border-white/20 text-white font-medium py-3 sm:py-4 px-6 rounded-xl hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
            onClick={() => {
              // Add follow functionality here
              console.log('Follow artist');
            }}
          >
            🔔 Follow Artist
          </button>
        </div>

        {/* Artist Links Section */}
        {artist.artistLinks && artist.artistLinks.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-2">
              🔗 Artist Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {artist.artistLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105 text-center"
                >
                  <div className="text-white font-medium text-sm sm:text-base">
                    {link.label || link.platform}
                  </div>
                  <div className="text-white/60 text-xs sm:text-sm mt-1 truncate">
                    {link.url}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Activity Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-2">
            📈 Artist Activity
          </h2>
          <div className="text-center text-white/60 py-8 lg:py-12">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">🎨</div>
            <p className="text-base sm:text-lg lg:text-xl mb-2">Activity feed coming soon...</p>
            <p className="text-xs sm:text-sm lg:text-base">
              This will show recent claps, interactions, and highlights
            </p>
          </div>
        </div>

        {/* Back to Discover Button - Mobile Friendly */}
        <div className="text-center mt-8 lg:mt-12">
          <button
            onClick={() => router.push('/discover')}
            className="bg-white/10 border border-white/20 text-white font-medium py-3 px-6 sm:px-8 rounded-xl hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
          >
            ← Discover More Artists
          </button>
        </div>
      </main>
    </div>
  );
}
