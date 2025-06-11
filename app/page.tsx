'use client';

import React, { useState } from 'react';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

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
        <button 
          onClick={() => setShowAuthModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            color: 'white',
            fontWeight: '500',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}>
          Connect Farcaster
        </button>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '3rem',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '2rem'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#333'
            }}>
              Farcaster Auth Coming Soon!
            </h2>
            <p style={{
              color: '#666',
              fontSize: '1.1rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              We're implementing real Farcaster authentication. For now, explore the platform and get ready to support amazing artists!
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Got It!
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  alert('Join our Discord: discord.gg/artclaps (coming soon!)');
                }}
                style={{
                  background: 'transparent',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  color: '#667eea',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Get Updates
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Status Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem',
            maxWidth: '900px',
            margin: '0 auto 4rem auto'
          }}>
            {/* Platform Status */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '1rem'
              }}>🎉</div>
              <h3 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                Platform Ready!
              </h3>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <div style={{ marginBottom: '0.5rem' }}>✅ Successfully Deployed</div>
                <div style={{ marginBottom: '0.5rem' }}>✅ Database Connected</div>
                <div style={{ marginBottom: '0.5rem' }}>✅ Beautiful UI Live</div>
                <div>⬜ Farcaster Auth (Next)</div>
              </div>
            </div>

            {/* Key Metrics Preview */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '1rem'
              }}>📊</div>
              <h3 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                Track Your Impact
              </h3>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <div style={{ marginBottom: '0.5rem' }}>🎯 Claps Score</div>
                <div style={{ marginBottom: '0.5rem' }}>⚖️ Support Ratio</div>
                <div style={{ marginBottom: '0.5rem' }}>🏆 Community Rank</div>
                <div>👥 Artists Supported</div>
              </div>
            </div>
          </div>

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
              Coming Very Soon
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.1rem',
              marginBottom: '2rem',
              maxWidth: '500px',
              margin: '0 auto 2rem auto'
            }}>
              Farcaster authentication, artist discovery, and real point tracking are being built right now.
            </p>
            <button 
              onClick={() => setShowAuthModal(true)}
              style={{
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2.5rem',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(118, 75, 162, 0.3)'
              }}>
              Get Early Access
            </button>
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
