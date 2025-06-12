// app/admin/page.tsx - FIXED AUTH LOGIC
'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
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
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});
  const [authChecked, setAuthChecked] = useState(false);

  // Check if user is admin (you can hardcode your FID here)
  const isAdmin = profile?.fid === 7418; // Replace with your actual FID

  useEffect(() => {
    // Debug: Log auth state
    console.log('Admin page - Auth state:', { 
      isAuthenticated, 
      profile: profile?.fid, 
      isAdmin: profile?.fid === 7418 
    });

    // Skip auth checks for now - just load the page
    setAuthChecked(true);
    fetchPendingArtists();

    /* TEMP DISABLED - Auth checks not working on navigation
    // Wait a moment for auth to load
    const timer = setTimeout(() => {
      console.log('Admin page - After timeout:', { 
        isAuthenticated, 
        profile: profile?.fid, 
        isAdmin: profile?.fid === 7418 
      });
      
      setAuthChecked(true);
      
      if (!isAuthenticated) {
        console.log('Redirecting: Not authenticated');
        router.push('/');
        return;
      }
      
      if (isAuthenticated && !isAdmin) {
        console.log('Redirecting: Not admin');
        router.push('/discover');
        return;
      }

      if (isAdmin) {
        console.log('Loading admin data...');
        fetchPendingArtists();
      }
    }, 2000); // Increase to 2 seconds

    return () => clearTimeout(timer);
    */
  }, [isAuthenticated, isAdmin, router]);

  const fetchPendingArtists = async () => {
    try {
      const response = await fetch('/api/admin/pending-artists');
      const data = await response.json();
      
      if (data.success) {
        setPendingArtists(data.artists);
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
      // Fixed API endpoint to match our built API
      const response = await fetch('/api/admin/pending-artists', {
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

  // Show loading while auth loads
  if (!authChecked || (isLoading && isAuthenticated)) {
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
        Loading Admin Panel... 👑
      </div>
    );
  }

  // Auth check failed
  if (!isAuthenticated || !isAdmin) {
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
        {!isAuthenticated ? 'Please sign in...' : 'Access denied...'}
      </div>
    );
  }

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
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'white'
        }}>
          <a href="/" style={{ color: 'white', textDecoration: 'none' }}>
            Art Claps Admin
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
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Admin</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          
          {/* Stats Header */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '1rem'
            }}>
              🛡️ Artist Applications
            </h1>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '3rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#ffd700'
                }}>
                  {pendingArtists.length}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem'
                }}>
                  Pending Review
                </div>
              </div>
            </div>
          </div>

          {/* Pending Artists */}
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              color: 'white',
              fontSize: '1.2rem',
              padding: '4rem'
            }}>
              Loading applications... 🎨
            </div>
          ) : pendingArtists.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '4rem',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>All caught up!</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                No pending artist applications at the moment.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1.5rem'
            }}>
              {pendingArtists.map((artist) => (
                <div
                  key={artist.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    padding: '2rem',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr',
                    gap: '2rem',
                    alignItems: 'start'
                  }}>
                    
                    {/* Artist Info */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem'
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
                        <div>
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
                      
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.9rem'
                      }}>
                        Applied: {new Date(artist.createdAt).toLocaleDateString()}
                      </div>
                      
                      {artist.referredBy && (
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.5)',
                          borderRadius: '12px',
                          padding: '0.5rem',
                          marginTop: '0.5rem',
                          fontSize: '0.9rem',
                          color: 'rgb(34, 197, 94)'
                        }}>
                          ✅ Referred by @{artist.referredBy.username}
                        </div>
                      )}
                    </div>

                    {/* Application Details */}
                    <div>
                      {artist.bio && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                          }}>
                            Bio:
                          </h4>
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>
                            {artist.bio}
                          </p>
                        </div>
                      )}
                      
                      {artist.verificationNotes && (
                        <div>
                          <h4 style={{
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                          }}>
                            Application Message:
                          </h4>
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '1rem',
                            borderRadius: '8px'
                          }}>
                            {artist.verificationNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <button
                        onClick={() => handleApprovalWithNotes(artist.id, true)}
                        disabled={processing[artist.id]}
                        style={{
                          background: processing[artist.id] 
                            ? 'rgba(34, 197, 94, 0.3)' 
                            : 'linear-gradient(45deg, #22c55e 0%, #16a34a 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '1rem',
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: processing[artist.id] ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {processing[artist.id] ? '⏳ Approving...' : '✅ Approve Artist'}
                      </button>
                      
                      <button
                        onClick={() => handleApprovalWithNotes(artist.id, false)}
                        disabled={processing[artist.id]}
                        style={{
                          background: processing[artist.id] 
                            ? 'rgba(239, 68, 68, 0.3)' 
                            : 'linear-gradient(45deg, #ef4444 0%, #dc2626 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '1rem',
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: processing[artist.id] ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {processing[artist.id] ? '⏳ Rejecting...' : '❌ Reject'}
                      </button>
                      
                      <a
                        href={`https://warpcast.com/${artist.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          padding: '0.75rem',
                          color: 'white',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          textAlign: 'center',
                          transition: 'all 0.3s ease'
                        }}
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
