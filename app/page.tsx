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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'white'
      }}>
        Art Claps
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* Logo/Icon */}
        <div style={{
          fontSize: '6rem',
          marginBottom: '2rem',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
        }}>
          🎨👏
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '800',
          color: 'white',
          marginBottom: '1rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Art Claps
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.5rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '1rem',
          fontWeight: '300'
        }}>
          The SocialFi Platform for Farcaster Artists
        </p>

        {/* Description */}
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.6',
          marginBottom: '3rem',
          maxWidth: '500px',
          margin: '0 auto 3rem auto'
        }}>
          Support amazing artists, earn CLAPS points, and build a thriving creative community. 
          Every clap, share, and connection earns you rewards while empowering artists.
        </p>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👏</div>
            <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Clap for Artists
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Support artists and earn 5 CLAPS points per artist daily
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Earn Rewards
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Share work, write critiques, and create art threads for more points
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</div>
            <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Build Community
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Connect with artists and track your support relationships
            </p>
          </div>
        </div>

        {/* Sign In Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            Ready to start supporting artists?
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '1.5rem',
            fontSize: '1rem'
          }}>
            Connect your Farcaster account to join the Art Claps community
          </p>

          {/* Sign In Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <SignInButton />
          </div>
        </div>

        {/* Beta Notice */}
        <p style={{
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontStyle: 'italic'
        }}>
          🚀 Now in beta • Building the future of artist support on Farcaster
        </p>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Built with ❤️ for the Farcaster art community
      </div>
    </div>
  );
}
