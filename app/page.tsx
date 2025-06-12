'use client';

import React, { useEffect } from 'react';
import { useProfile, SignInButton } from '@farcaster/auth-kit';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();

  // Redirect to discover page if already signed in
  useEffect(() => {
    if (isAuthenticated && profile) {
      router.push('/discover');
    }
  }, [isAuthenticated, profile, router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 3rem',
        position: 'relative'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'white'
        }}>
          Art Claps
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <SignInButton />
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        
        {/* Hero Section */}
        <div style={{ marginBottom: '6rem' }}>
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: '800',
            marginBottom: '2rem',
            lineHeight: '1.1',
            letterSpacing: '-0.02em'
          }}>
            <span style={{
              background: 'linear-gradient(90deg, #fff 0%, #fff 40%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'white'
            }}>
              Support Artists.
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #ffd700 0%, #ff6b6b 20%, #4ecdc4 40%, #45b7d1 60%, #96ceb4 80%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block'
            }}>
              Earn Rewards.
            </span>
          </h1>
          
          <p style={{
            fontSize: '1.3rem',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            The SocialFi platform where supporting Farcaster artists earns you points, builds community, and rewards authentic engagement.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2rem',
          width: '100%',
          maxWidth: '900px',
          marginBottom: '4rem'
        }}>
          
          {/* Clap to Earn */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            transition: 'transform 0.3s ease, background 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>
              👏
            </div>
            <h3 style={{
              color: 'white',
              fontSize: '1.4rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              Clap to Earn
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Support artists and earn points for genuine engagement
            </p>
          </div>

          {/* Discover Artists */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            transition: 'transform 0.3s ease, background 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>
              🎨
            </div>
            <h3 style={{
              color: 'white',
              fontSize: '1.4rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              Discover Artists
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Find and connect with amazing creators on Farcaster
            </p>
          </div>

          {/* Build Reputation */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            transition: 'transform 0.3s ease, background 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>
              🏆
            </div>
            <h3 style={{
              color: 'white',
              fontSize: '1.4rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              Build Reputation
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Climb the leaderboard as a true community supporter
            </p>
          </div>

          {/* Unlock Rewards */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            transition: 'transform 0.3s ease, background 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}>
              💎
            </div>
            <h3 style={{
              color: 'white',
              fontSize: '1.4rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              Unlock Rewards
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              lineHeight: '1.5'
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
          borderRadius: '24px',
          padding: '3rem 2rem',
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            Ready to start supporting artists?
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1.1rem',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Connect your Farcaster account to join the Art Claps community and start earning rewards for authentic engagement.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <SignInButton />
            
            {/* Apply to Become Artist Button */}
            <a 
              href="/apply"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '1rem 2rem',
                color: 'white',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🎨 Apply to Become Artist
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '4rem',
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center'
        }}>
          🚀 Now in beta • Building the future of artist support on Farcaster
        </div>
      </main>
    </div>
  );
}
