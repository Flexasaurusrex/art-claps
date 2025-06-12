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
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/discover')}
            className="text-white hover:text-purple-200 transition-colors cursor-pointer bg-transparent border-none"
          >
            ← Back to Discover
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex flex-col items-center text-center">
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
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{artist.displayName}</h1>
              <p className="text-xl text-purple-200 mb-4">@{artist.username}</p>
              
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                {artist.extendedBio || artist.bio}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{artist.claps}</div>
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
