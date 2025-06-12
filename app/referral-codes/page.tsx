'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
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
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // Skip auth checks - just load the page
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      // Use a default FID if profile not loaded yet
      const fid = profile?.fid || 7418; // Your FID as fallback
      const response = await fetch(`/api/referrals?fid=${fid}`);
      const data = await response.json();
      
      if (data.success) {
        setReferralCodes(data.codes);
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewCode = async () => {
    setIsGenerating(true);
    
    try {
      const fid = profile?.fid || 7418; // Your FID as fallback
      const response = await fetch('/api/referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFid: fid
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
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
          <a 
            href="/discover"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              fontSize: '1rem'
            }}
          >
            ← Back to Discover
          </a>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src={profile?.pfpUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'} 
              alt={profile?.displayName || 'Admin'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            />
            <div style={{ color: 'white' }}>
              <div style={{ fontWeight: '600' }}>{profile?.displayName || 'Admin'}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Verified Artist</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '0 2rem 4rem 2rem' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          
          {/* Header Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '1rem'
            }}>
              🎟️ Artist Referrals
            </h1>
            
            <p style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Invite fellow artists to join Art Claps! Each referral code instantly verifies new artists.
            </p>

            {userData && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '3rem',
                marginBottom: '2rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#ffd700'
                  }}>
                    {userData.totalCodes - userData.usedCodes}
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '1rem'
                  }}>
                    Available Codes
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#22c55e'
                  }}>
                    {userData.usedCodes}
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '1rem'
                  }}>
                    Artists Invited
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={generateNewCode}
              disabled={isGenerating}
              style={{
                background: isGenerating 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isGenerating ? '⏳ Generating...' : '✨ Generate New Code'}
            </button>
          </div>

          {/* Referral Codes List */}
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              color: 'white',
              fontSize: '1.2rem',
              padding: '2rem'
            }}>
              Loading your referral codes... 🎨
            </div>
          ) : referralCodes.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '3rem',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No referral codes yet</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Generate your first code to start inviting fellow artists!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {referralCodes.map((referral) => (
                <div
                  key={referral.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${referral.used ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: referral.used ? '0.5rem' : '0'
                    }}>
                      <code style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'white',
                        fontFamily: 'monospace'
                      }}>
                        {referral.code}
                      </code>
                      
                      {referral.used ? (
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.5)',
                          borderRadius: '20px',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.8rem',
                          color: 'rgb(34, 197, 94)',
                          fontWeight: '600'
                        }}>
                          ✓ Used
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(255, 193, 7, 0.2)',
                          border: '1px solid rgba(255, 193, 7, 0.5)',
                          borderRadius: '20px',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.8rem',
                          color: 'rgb(255, 193, 7)',
                          fontWeight: '600'
                        }}>
                          Available
                        </div>
                      )}
                    </div>
                    
                    {referral.used && referral.usedBy && (
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.9rem'
                      }}>
                        Used by @{referral.usedBy.username} ({referral.usedBy.displayName})
                      </div>
                    )}
                  </div>

                  {!referral.used && (
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => copyToClipboard(referral.code)}
                        style={{
                          background: copiedCode === referral.code 
                            ? 'rgba(34, 197, 94, 0.3)' 
                            : 'rgba(255, 255, 255, 0.2)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          color: 'white',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {copiedCode === referral.code ? '✓ Copied' : '📋 Copy'}
                      </button>
                      
                      <button
                        onClick={() => shareCode(referral.code)}
                        style={{
                          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          color: 'white',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🚀 Share
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* How It Works */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '2rem',
            marginTop: '2rem'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '1.3rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              💡 How Referrals Work
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong style={{ color: 'white' }}>1. Share Code</strong><br />
                Send your referral code to artist friends
              </div>
              <div>
                <strong style={{ color: 'white' }}>2. Instant Verification</strong><br />
                They get verified immediately when applying
              </div>
              <div>
                <strong style={{ color: 'white' }}>3. Build Community</strong><br />
                Help grow the verified artist network
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
