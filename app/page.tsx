'use client';

import React from 'react';
import { useProfile } from '@farcaster/auth-kit';
import { CustomSignInButton, CustomSignInButtonLarge } from './components/CustomSignIn';

export default function Home() {
  const { isAuthenticated, profile } = useProfile();

  // If user is authenticated, show dashboard with real Farcaster data
  if (isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header for authenticated user */}
        <header style={{
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '-0.02em'
          }}>
            Art Claps
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

        {/* Dashboard Content */}
        <main style={{ padding: '0 2rem' }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '2rem'
          }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              🎉 Welcome to Art Claps, {profile.displayName}!
            </h1>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '3rem'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                🔗 Successfully Connected to Farcaster!
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '1rem'
              }}>
                FID: {profile.fid} • Username: @{profile.username}
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem'
              }}>
                Real Farcaster authentication is now working! 🚀
              </p>
            </div>

            {/* User Stats Dashboard */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginBottom: '4rem'
            }}>
              {/* Claps Score */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👏</div>
                <h3 style={{
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem'
                }}>
                  0
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Claps Score</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Start clapping for artists to earn points!
                </p>
              </div>

              {/* Artists Supported */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
                <h3 style={{
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem'
                }}>
                  0
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Artists Supported</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Discover amazing Farcaster artists
                </p>
              </div>

              {/* Community Rank */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                <h3 style={{
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem'
                }}>
                  New
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Community Rank</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Start supporting to climb the leaderboard
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '4rem',
              flexWrap: 'wrap'
            }}>
              <button style={{
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(118, 75, 162, 0.3)'
              }}>
                Discover Artists
              </button>
              <button style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '1rem 2rem',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}>
                View Leaderboard
              </button>
            </div>

            {/* Coming Soon */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                🚀 REAL FARCASTER AUTH IS WORKING!
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
                marginBottom: '1rem'
              }}>
                You've successfully connected with your actual Farcaster account!
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1rem'
              }}>
                Artist discovery, clapping mechanism, and point tracking coming next.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Landing page for unauthenticated users
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
          color: 'white',
          letterSpacing: '-0.02em'
        }}>
          Art Claps
        </div>
        <CustomSignInButton />
      </header>

      {/* Hero Section */}
      <main style={{ padding: '0 2rem' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          paddingTop: '4rem'
        }}>
          {/* Hero Text */}
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: '800',
            color: 'white',
            marginBottom: '1.5rem',
            lineHeight: '1.1',
            letterSpacing: '-0.03em'
          }}>
            Support Artists.<br />
            <span style={{
              background: 'linear-gradient(45deg, #ffd89b 0%, #19547b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Earn Rewards.
            </span>
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem auto',
            lineHeight: '1.6'
          }}>
            The SocialFi platform where supporting Farcaster artists earns you points, 
            builds community, and rewards authentic engagement.
          </p>

          {/* Feature Showcase */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '4rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👏</div>
              <h4 style={{
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Clap to Earn
              </h4>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                Support artists and earn points for genuine engagement
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎨</div>
              <h4 style={{
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Discover Artists
              </h4>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                Find and connect with amazing creators on Farcaster
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
              <h4 style={{
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Build Reputation
              </h4>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                Climb the leaderboard as a true community supporter
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💎</div>
              <h4 style={{
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Unlock Rewards
              </h4>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                Redeem points for exclusive artist collaborations
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              Ready to Start?
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.1rem',
              marginBottom: '2rem',
              maxWidth: '500px',
              margin: '0 auto 2rem auto'
            }}>
              Connect your Farcaster account and start supporting artists today.
            </p>
            <CustomSignInButtonLarge />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        color: 'rgba(255, 255, 255, 0.6)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <p>Art Claps • Building community through authentic support</p>
      </footer>
    </div>
  );
}
