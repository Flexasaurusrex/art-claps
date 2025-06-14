// app/admin/page.tsx - FIXED with full URL
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface PendingArtist {
  id: string;
  farcasterFid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  verificationNotes: string;
  createdAt: string;
  referredBy?: {
    username: string;
    displayName: string;
  };
}

export default function AdminPage() {
  const { isAuthenticated, profile, refreshAuth } = useAuth();
  const router = useRouter();
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});
  const [authChecked, setAuthChecked] = useState(false);

  // Check if user is admin (FID 7418)
  const isAdmin = profile?.fid === 7418;

  // Refresh auth on page load
  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    // Debug: Log auth state
    console.log('Admin page - Auth state:', { 
      isAuthenticated, 
      profile: profile?.fid, 
      isAdmin: profile?.fid === 7418,
      profileData: profile
    });

    // Skip auth checks for now - just load the page
    setAuthChecked(true);
    fetchPendingArtists();
  }, [isAuthenticated, isAdmin, router]);

  const fetchPendingArtists = async () => {
    try {
      // FIXED: Using full URL instead of relative URL
      const response = await fetch('https://art-claps.vercel.app/api/admin/pending-artists');
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      if (data.success) {
        setPendingArtists(data.artists);
        console.log('Set pending artists:', data.artists.length); // Debug log
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pending artists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalWithNotes = (artistId: string, approved: boolean) => {
    const action = approved ? 'approve' : 'reject';
    const notes = prompt(
      `${approved ? 'Approve' : 'Reject'} this artist application?\n\nOptional admin notes:`,
      approved ? 'Welcome to Art Claps!' : 'Please reapply with more details.'
    );
    
    if (notes !== null) { // User didn't cancel
      handleApproval(artistId, approved, notes);
    }
  };

  const handleApproval = async (artistId: string, approved: boolean, adminNotes?: string) => {
    setProcessing(prev => ({ ...prev, [artistId]: true }));

    try {
      // FIXED: Using full URL for POST request too
      const response = await fetch('https://art-claps.vercel.app/api/admin/pending-artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          action: approved ? 'approve' : 'reject',
          adminNotes: adminNotes || (approved ? 'Approved via admin dashboard' : 'Rejected via admin dashboard')
        })
      });

      const data = await response.json();

      if (data.success) {
        // Remove the artist from pending list
        setPendingArtists(prev => prev.filter(artist => artist.id !== artistId));
        
        // Show success message
        alert(data.message || `Artist ${approved ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert(data.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval');
    } finally {
      setProcessing(prev => ({ ...prev, [artistId]: false }));
    }
  };

  // Show loading while data loads
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg lg:text-xl px-4">
        Loading Admin Panel... 👑
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      {/* Header */}
      <header className="p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 gap-4">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
          <a href="/" className="text-white no-underline hover:text-purple-200 transition-colors">
            Art Claps Admin
          </a>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
          <button 
            onClick={() => router.push('/discover')}
            className="text-white/80 hover:text-white bg-transparent border-none text-sm lg:text-base transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Discover
          </button>
          
          {profile && (
            <div className="flex items-center gap-3">
              <img 
                src={profile.pfpUrl} 
                alt={profile.displayName}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/30"
              />
              <div className="text-white">
                <div className="font-semibold text-sm sm:text-base">{profile.displayName}</div>
                <div className="text-xs sm:text-sm opacity-80">Admin</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Stats Header */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 lg:mb-6">
              🛡️ Artist Applications
            </h1>
            
            <div className="flex justify-center">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-400 mb-2">
                  {pendingArtists.length}
                </div>
                <div className="text-white/80 text-sm sm:text-base lg:text-lg">
                  Pending Review
                </div>
              </div>
            </div>
          </div>

          {/* Pending Artists */}
          {isLoading ? (
            <div className="text-center text-white text-lg lg:text-xl py-16">
              Loading applications... 🎨
            </div>
          ) : pendingArtists.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-8 lg:p-16 text-center text-white">
              <div className="text-4xl lg:text-5xl mb-4 lg:mb-6">✨</div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">All caught up!</h2>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg">
                No pending artist applications at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-6">
              {pendingArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 transition-transform hover:-translate-y-1"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                    
                    {/* Artist Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                        <img
                          src={artist.pfpUrl}
                          alt={artist.displayName}
                          className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-2 lg:border-3 border-white/30"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white text-base sm:text-lg lg:text-xl font-bold mb-1 truncate">
                            {artist.displayName}
                          </h3>
                          <p className="text-white/70 text-sm sm:text-base truncate">
                            @{artist.username}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-white/60 text-xs sm:text-sm mb-2">
                        Applied: {new Date(artist.createdAt).toLocaleDateString()}
                      </div>
                      
                      {artist.referredBy && (
                        <div className="bg-green-500/20 border border-green-500/50 rounded-xl px-2 py-1 text-xs sm:text-sm text-green-400 font-medium">
                          ✅ Referred by @{artist.referredBy.username}
                        </div>
                      )}
                    </div>

                    {/* Application Details */}
                    <div className="lg:col-span-6">
                      {artist.bio && (
                        <div className="mb-4 lg:mb-6">
                          <h4 className="text-white text-sm sm:text-base lg:text-lg font-semibold mb-2">
                            Bio:
                          </h4>
                          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                            {artist.bio}
                          </p>
                        </div>
                      )}
                      
                      {artist.verificationNotes && (
                        <div>
                          <h4 className="text-white text-sm sm:text-base lg:text-lg font-semibold mb-2">
                            Application Message:
                          </h4>
                          <p className="text-white/80 text-sm sm:text-base leading-relaxed bg-white/5 p-3 lg:p-4 rounded-xl">
                            {artist.verificationNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 lg:gap-3">
                      <button
                        onClick={() => handleApprovalWithNotes(artist.id, true)}
                        disabled={processing[artist.id]}
                        className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-white text-xs sm:text-sm lg:text-base font-semibold transition-all border-none ${
                          processing[artist.id]
                            ? 'bg-green-500/30 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 cursor-pointer'
                        }`}
                      >
                        {processing[artist.id] ? '⏳ Approving...' : '✅ Approve'}
                      </button>
                      
                      <button
                        onClick={() => handleApprovalWithNotes(artist.id, false)}
                        disabled={processing[artist.id]}
                        className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-white text-xs sm:text-sm lg:text-base font-semibold transition-all border-none ${
                          processing[artist.id]
                            ? 'bg-red-500/30 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 cursor-pointer'
                        }`}
                      >
                        {processing[artist.id] ? '⏳ Rejecting...' : '❌ Reject'}
                      </button>
                      
                      <a
                        href={`https://warpcast.com/${artist.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 lg:flex-none bg-white/10 border border-white/20 rounded-xl px-3 lg:px-4 py-2 lg:py-3 text-white no-underline text-xs sm:text-sm lg:text-base font-medium text-center transition-all hover:bg-white/20 hover:scale-105"
                      >
                        🔍 View Profile
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
