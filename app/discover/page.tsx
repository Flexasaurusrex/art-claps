'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';

interface Artist {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  isArtist: boolean;
  claps: number;
}

// Mock artist data for now - we'll replace with real API calls
const mockArtists: Artist[] = [
  {
    fid: 3621,
    username: 'artgirl',
    displayName: 'Sarah Chen',
    pfpUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b734?w=150&h=150&fit=crop&crop=face',
    bio: '🎨 Digital artist creating NFT collections • AI art explorer • Building on Farcaster',
    followerCount: 2543,
    followingCount: 892,
    isArtist: true,
    claps: 1247
  },
  {
    fid: 7832,
    username: 'pixelmaster',
    displayName: 'Alex Rivera',
    pfpUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Pixel art & 8-bit animations • Building retro-futuristic worlds • NFT creator',
    followerCount: 1876,
    followingCount: 445,
    isArtist: true,
    claps: 934
  },
  {
    fid: 5429,
    username: 'abstractwave',
    displayName: 'Maya Okonkwo',
    pfpUrl: 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=150&h=150&fit=crop&crop=face',
    bio: 'Abstract expressionist • Physical & digital mediums • Exploring color theory',
    followerCount: 3201,
    followingCount: 1203,
    isArtist: true,
    claps: 1856
  },
  {
    fid: 9156,
    username: 'neonartist',
    displayName: 'Jamie Kim',
    pfpUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
    bio: 'Neon art installations • Cyberpunk aesthetics • Tokyo vibes in digital form',
    followerCount: 4127,
    followingCount: 673,
    isArtist: true,
    claps: 2103
  },
  {
    fid: 2847,
    username: 'clayworks',
    displayName: 'David Park',
    pfpUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Ceramic artist • Traditional techniques meet modern design • Sustainable art',
    followerCount: 1432,
    followingCount: 234,
    isArtist: true,
    claps: 687
  },
  {
    fid: 6734,
    username: 'streetframes',
    displayName: 'Luna Rodriguez',
    pfpUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Street photographer • Capturing urban stories • Film & digital hybrid',
    followerCount: 5643,
    followingCount: 1876,
    isArtist: true,
    claps: 3247
  }
];

export default function DiscoverPage() {
  const { isAuthenticated, profile } = useProfile();
  const [artists, setArtists] = useState<Artist[]>(mockArtists);
  const [userClaps, setUserClaps] = useState<{[key: number]: boolean}>({});
  const [loading, setLoading] = useState<{[key: number]: boolean}>({});

  const handleClap = async (artistFid: number) => {
    if (!isAuthenticated) return;
    
    setLoading(prev => ({ ...prev, [artistFid]: true }));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local state
    setArtists(prev => prev.map(artist => 
      artist.fid === artistFid 
        ? { ...artist, claps: artist.claps + 1 }
        : artist
    ));
    
    setUserClaps(prev => ({ ...prev, [artistFid]: true }));
    setLoading(prev => ({ ...prev, [artistFid]: false }));
    
    // TODO: Send to database
    console.log(`User ${profile.fid} clapped for artist ${artistFid}`);
  };

  if (!isAuthenticated) {
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
        Please sign in to discover artists
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
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>@{profile.username}</div>
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
            Support amazing Farcaster artists and earn claps points for genuine engagement
          </p>

          {/* Artists Grid */}
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
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  padding: '2rem',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
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
                      {artist.followerCount.toLocaleString()}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.9rem'
                    }}>
                      Followers
                    </div>
                  </div>
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
                </div>

                {/* Clap Button */}
                <button
                  onClick={() => handleClap(artist.fid)}
                  disabled={loading[artist.fid] || userClaps[artist.fid]}
                  style={{
                    width: '100%',
                    background: userClaps[artist.fid] 
                      ? 'rgba(34, 197, 94, 0.3)' 
                      : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: loading[artist.fid] || userClaps[artist.fid] ? 'not-allowed' : 'pointer',
                    opacity: loading[artist.fid] || userClaps[artist.fid] ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading[artist.fid] ? '👏 Clapping...' : 
                   userClaps[artist.fid] ? '✅ Clapped!' : 
                   '👏 Clap for Artist (+10 pts)'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
