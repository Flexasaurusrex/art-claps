'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ReferralCode {
  id: string;
  code: string;
  used: boolean;
  usedBy?: {
    username: string;
    displayName: string;
  };
  createdAt: string;
}

interface UserData {
  artistStatus: string;
  totalCodes: number;
  usedCodes: number;
}

export default function ReferralPage() {
  const { isAuthenticated, profile, refreshAuth } = useAuth();
  const router = useRouter();
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Refresh auth on page load
  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    // Wait for profile to be available, then fetch data
    if (profile?.fid) {
      fetchReferralData();
    } else if (!profile && !isLoading) {
      // If no profile and not loading, set loading to false
      setIsLoading(false);
    }
  }, [profile]);

  const fetchReferralData = async () => {
    if (!profile?.fid) {
      console.log('No profile.fid available for referral data');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/referrals?fid=${profile.fid}`);
      const data = await response.json();
      
      if (data.success) {
        setReferralCodes(data.codes);
        setUserData(data.user);
      } else {
        console.error('Referral data fetch failed:', data.error);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewCode = async () => {
    if (!profile?.fid) {
      alert('Please sign in to generate referral codes');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFid: profile.fid
        })
      });

      const data = await response.json();

      if (data.success) {
        setReferralCodes(prev => [data.code, ...prev]);
        setUserData(prev => prev ? {
          ...prev,
          totalCodes: prev.totalCodes + 1
        } : null);
      } else {
        alert(data.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareCode = (code: string) => {
    const shareText = `🎨 Join Art Claps as a verified artist!\n\nUse my referral code: ${code}\n\nApply at: https://art-claps.vercel.app/apply\n\n#FarcasterArt #ArtClaps`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Art Claps Artist Referral',
        text: shareText
      });
    } else {
      copyToClipboard(shareText);
      alert('Referral message copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      {/* Header */}
      <header className="p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
          <a href="/" className="text-white no-underline hover:text-purple-200 transition-colors">
            Art Claps
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
                <div className="text-xs sm:text-sm opacity-80">
                  {profile.fid === 7418 ? 'Admin' : 'Verified Artist'}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12 text-center mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 lg:mb-6">
              🎟️ Artist Referrals
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 lg:mb-8 leading-relaxed max-w-2xl mx-auto">
              Invite fellow artists to join Art Claps! Each referral code instantly verifies new artists.
            </p>

            {userData && (
              <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-12 mb-6 lg:mb-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-400 mb-2">
                    {userData.totalCodes - userData.usedCodes}
                  </div>
                  <div className="text-white/80 text-sm sm:text-base lg:text-lg">
                    Available Codes
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-400 mb-2">
                    {userData.usedCodes}
                  </div>
                  <div className="text-white/80 text-sm sm:text-base lg:text-lg">
                    Artists Invited
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={generateNewCode}
              disabled={isGenerating || !profile}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-white text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 border-none ${
                isGenerating || !profile
                  ? 'bg-white/30 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 cursor-pointer'
              }`}
            >
              {isGenerating ? '⏳ Generating...' : 
               !profile ? '🔒 Sign in to Generate' :
               '✨ Generate New Code'}
            </button>
          </div>

          {/* Referral Codes List */}
          {isLoading ? (
            <div className="text-center text-white text-lg lg:text-xl py-8 lg:py-16">
              Loading your referral codes... 🎨
            </div>
          ) : !profile ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-8 lg:p-12 text-center text-white">
              <div className="text-4xl lg:text-5xl mb-4 lg:mb-6">🔐</div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">Sign in to access referrals</h2>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg">
                Please sign in to view and generate your referral codes.
              </p>
            </div>
          ) : referralCodes.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-8 lg:p-12 text-center text-white">
              <div className="text-4xl lg:text-5xl mb-4 lg:mb-6">🎫</div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">No referral codes yet</h2>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg">
                Generate your first code to start inviting fellow artists!
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {referralCodes.map((referral) => (
                <div
                  key={referral.id}
                  className={`bg-white/10 backdrop-blur-xl border rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 ${
                    referral.used ? 'border-green-500/50' : 'border-white/20'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    
                    {/* Code and Status */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 lg:mb-0">
                        <code className="bg-white/20 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-base sm:text-lg lg:text-xl font-semibold text-white font-mono break-all">
                          {referral.code}
                        </code>
                        
                        {referral.used ? (
                          <div className="bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1 text-xs sm:text-sm text-green-400 font-semibold self-start">
                            ✓ Used
                          </div>
                        ) : (
                          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-full px-3 py-1 text-xs sm:text-sm text-yellow-400 font-semibold self-start">
                            Available
                          </div>
                        )}
                      </div>
                      
                      {referral.used && referral.usedBy && (
                        <div className="text-white/70 text-sm sm:text-base lg:mt-2">
                          Used by @{referral.usedBy.username} ({referral.usedBy.displayName})
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!referral.used && (
                      <div className="flex flex-row gap-2 lg:gap-3">
                        <button
                          onClick={() => copyToClipboard(referral.code)}
                          className={`flex-1 lg:flex-none px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-white text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 border-none cursor-pointer ${
                            copiedCode === referral.code 
                              ? 'bg-green-500/30 cursor-default' 
                              : 'bg-white/20 hover:bg-white/30'
                          }`}
                        >
                          {copiedCode === referral.code ? '✓ Copied' : '📋 Copy'}
                        </button>
                        
                        <button
                          onClick={() => shareCode(referral.code)}
                          className="flex-1 lg:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-white text-xs sm:text-sm lg:text-base font-medium cursor-pointer transition-all duration-300 hover:scale-105 border-none"
                        >
                          🚀 Share
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* How It Works */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12 mt-6 lg:mt-8">
            <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-bold mb-4 lg:mb-6">
              💡 How Referrals Work
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 text-white/80 text-sm sm:text-base">
              <div className="text-center sm:text-left">
                <div className="text-white font-semibold mb-2">1. Share Code</div>
                <div>Send your referral code to artist friends</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-white font-semibold mb-2">2. Instant Verification</div>
                <div>They get verified immediately when applying</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-white font-semibold mb-2">3. Build Community</div>
                <div>Help grow the verified artist network</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
