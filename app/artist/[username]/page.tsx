'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

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
  follower_count?: number;
  following_count?: number;
}

interface UserStats {
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  supportGiven: number;
  supportReceived: number;
}

export default function ArtistProfilePage() {
  const { isAuthenticated, profile, refreshAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [clapping, setClapping] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [alreadyClappedToday, setAlreadyClappedToday] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    extendedBio: '',
    artistLinks: [] as any[]
  });

  const username = params.username as string;

  useEffect(() => {
    if (username) {
      fetchArtistProfile();
    }
  }, [username]);

  // Fetch user stats when authenticated
  useEffect(() => {
    if (isAuthenticated && profile) {
      fetchUserStats();
      if (artist) {
        checkFollowStatus();
      }
    }
  }, [isAuthenticated, profile, artist]);

  // Refresh auth on page load
  useEffect(() => {
    refreshAuth();
  }, []);

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

  const fetchArtistProfile = async () => {
    try {
      const currentUserFid = profile?.fid || '';
      const response = await fetch(`/api/artists?username=${username}&currentUserFid=${currentUserFid}`);
      const data = await response.json();
      
      if (data.success) {
        setArtist(data.artist);
        // Check if user already clapped today (if the API returns this info)
        setAlreadyClappedToday(data.artist.alreadyClappedToday || false);
      } else {
        router.push('/discover');
      }
    } catch (error) {
      console.error('Error fetching artist profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!isAuthenticated || !profile || !artist) return;
    
    try {
      const response = await fetch(`/api/follow?userFid=${profile.fid}&targetFid=${artist.farcasterFid}`);
      const data = await response.json();
      
      if (data.success) {
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !profile || !artist || followLoading) return;
    
    setFollowLoading(true);
    
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userFid: profile.fid,
          targetFid: artist.farcasterFid,
          action: isFollowing ? 'unfollow' : 'follow'
        })
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
        
        // Update artist follower count
        setArtist(prev => prev ? {
          ...prev,
          follower_count: isFollowing 
            ? (prev.follower_count || 0) - 1 
            : (prev.follower_count || 0) + 1
        } : null);

        // Update user stats if following (10 points earned)
        if (!isFollowing && userStats) {
          setUserStats(prev => prev ? {
            ...prev,
            totalPoints: data.newTotalPoints || prev.totalPoints + 10,
            weeklyPoints: prev.weeklyPoints + 10,
            monthlyPoints: prev.monthlyPoints + 10
          } : null);
        }

        // Show success feedback
        const action = isFollowing ? 'Unfollowed' : 'Followed';
        const pointsMsg = !isFollowing ? ' (+10 CLAPS points earned!)' : '';
        alert(`🎉 ${action} ${artist.displayName}!${pointsMsg}`);

      } else {
        console.error('API Error:', data);
        alert(data.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleClap = async () => {
    if (!isAuthenticated || !profile || !artist || clapping) return;
    
    setClapping(true);
    
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
        // Update local artist state
        setArtist(prev => prev ? { 
          ...prev, 
          claps: prev.claps + 1,
          supportReceived: prev.supportReceived + 1 
        } : null);

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

        // Mark as clapped today
        setAlreadyClappedToday(true);

        // Show success feedback
        alert(`🎉 Clapped for ${artist.displayName}! +5 CLAPS points earned!`);

      } else {
        alert(data.error || 'Failed to record clap');
      }
    } catch (error) {
      console.error('Error clapping:', error);
      alert('Failed to record clap. Please try again.');
    } finally {
      setClapping(false);
    }
  };

  // Check if user can edit this profile
  const canEditProfile = () => {
    if (!isAuthenticated || !profile || !artist) return false;
    
    // Admin can edit any profile
    if (profile.fid === 7418) return true;
    
    // Users can edit their own profile
    if (profile.fid === artist.farcasterFid) return true;
    
    // Verified artists can edit their own profile
    if (profile.fid === artist.farcasterFid && artist.verifiedArtist) return true;
    
    return false;
  };

  const handleEditProfile = () => {
    setEditForm({
      extendedBio: artist?.extendedBio || artist?.bio || '',
      artistLinks: artist?.artistLinks || []
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!artist || editLoading) return;
    
    setEditLoading(true);
    
    try {
      const response = await fetch('/api/profile/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: artist.farcasterFid,
          extendedBio: editForm.extendedBio,
          artistLinks: editForm.artistLinks
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local artist state
        setArtist(prev => prev ? {
          ...prev,
          extendedBio: editForm.extendedBio,
          artistLinks: editForm.artistLinks
        } : null);

        setShowEditModal(false);
        alert('🎉 Profile updated successfully!');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const addArtistLink = () => {
    setEditForm(prev => ({
      ...prev,
      artistLinks: [...prev.artistLinks, { label: '', url: '' }]
    }));
  };

  const updateArtistLink = (index: number, field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      artistLinks: prev.artistLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeArtistLink = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      artistLinks: prev.artistLinks.filter((_, i) => i !== index)
    }));
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
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 lg:mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 break-words">
                    {artist.displayName}
                  </h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-purple-200 mb-4 lg:mb-6">
                    @{artist.username}
                  </p>
                </div>
                
                {/* Edit Profile Button */}
                {canEditProfile() && (
                  <button
                    onClick={handleEditProfile}
                    className="bg-white/10 border border-white/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-300 text-sm flex items-center gap-2 self-center lg:self-start"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
              
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
                    {(artist.follower_count || artist.connections).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-white/60">
                    Followers
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
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 lg:mb-8">
          {/* Clap Button - Full Width */}
          <button 
            onClick={handleClap}
            disabled={clapping || alreadyClappedToday || !isAuthenticated}
            className={`w-full font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 text-sm sm:text-base border-none cursor-pointer ${
              alreadyClappedToday
                ? 'bg-green-500/30 text-green-300 cursor-not-allowed' 
                : clapping
                ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                : !isAuthenticated
                ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105'
            }`}
          >
            {clapping ? '👏 Clapping...' : 
             alreadyClappedToday ? '✅ Clapped!' : 
             !isAuthenticated ? '🔒 Sign in to Clap' :
             `👏 Clap for ${artist.displayName} (+5)`}
          </button>
          
          {/* Dual Follow Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              onClick={handleFollow}
              disabled={followLoading || !isAuthenticated}
              className={`flex-1 font-medium py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 text-sm sm:text-base cursor-pointer border-none ${
                !isAuthenticated
                  ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                  : followLoading
                  ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                  : isFollowing
                  ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 hover:bg-orange-500/30'
                  : 'bg-blue-500/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
              }`}
            >
              {followLoading ? '⏳ Loading...' :
               !isAuthenticated ? '🔒 Sign in to Follow' :
               isFollowing ? '✓ Following' : 
               `🔔 Follow on Art Claps (+10)`}
            </button>
            
            <a
              href={`https://warpcast.com/${artist.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-500/20 border border-purple-500/50 text-purple-300 font-medium py-3 sm:py-4 px-6 rounded-xl hover:bg-purple-500/30 transition-all duration-300 text-sm sm:text-base cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View on Farcaster
            </a>
          </div>
        </div>

        {/* User Stats Display - Show when authenticated */}
        {isAuthenticated && userStats && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-4 sm:p-6 mb-6 lg:mb-8">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">Your Stats</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {userStats.totalPoints.toLocaleString()}
                </div>
                <div className="text-xs lg:text-sm text-white/60">
                  Total CLAPS
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {userStats.weeklyPoints}
                </div>
                <div className="text-xs lg:text-sm text-white/60">
                  This Week
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {userStats.supportGiven}
                </div>
                <div className="text-xs lg:text-sm text-white/60">
                  Support Given
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {userStats.supportReceived}
                </div>
                <div className="text-xs lg:text-sm text-white/60">
                  Support Received
                </div>
              </div>
            </div>
          </div>
        )}

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
            className="bg-white/10 border border-white/20 text-white font-medium py-3 px-6 sm:px-8 rounded-xl hover:bg-white/20 transition-all duration-300 text-sm sm:text-base cursor-pointer"
          >
            ← Discover More Artists
          </button>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Extended Bio */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Bio</label>
                <textarea
                  value={editForm.extendedBio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, extendedBio: e.target.value }))}
                  placeholder="Tell us about your art and creative journey..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 resize-none"
                  rows={4}
                />
              </div>

              {/* Artist Links */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-white font-medium">Artist Links</label>
                  <button
                    onClick={addArtistLink}
                    className="bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                  >
                    + Add Link
                  </button>
                </div>

                {editForm.artistLinks.map((link, index) => (
                  <div key={index} className="flex gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Label (e.g., Portfolio)"
                      value={link.label || ''}
                      onChange={(e) => updateArtistLink(index, 'label', e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link.url || ''}
                      onChange={(e) => updateArtistLink(index, 'url', e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => removeArtistLink(index)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {editForm.artistLinks.length === 0 && (
                  <p className="text-white/50 text-sm italic">No links added yet</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white/10 border border-white/20 text-white font-medium py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                  className={`flex-1 font-medium py-3 px-6 rounded-xl transition-colors ${
                    editLoading
                      ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
