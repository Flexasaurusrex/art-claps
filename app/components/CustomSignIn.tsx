'use client';

import React, { useState } from 'react';
import { SignInButton as FarcasterSignInButton, useSignInMessage, useProfile } from '@farcaster/auth-kit';

// Custom styled SignIn button that works without CSS imports
export function CustomSignInButton() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div style={{ position: 'relative' }}>
      <FarcasterSignInButton 
        style={{
          background: isHovered 
            ? 'rgba(255, 255, 255, 0.3)' 
            : 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem 1.5rem',
          color: 'white',
          fontWeight: '500',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          fontSize: '1rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered 
            ? '0 8px 25px rgba(255, 255, 255, 0.2)' 
            : '0 4px 15px rgba(255, 255, 255, 0.1)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  );
}

// For CTA sections
export function CustomSignInButtonLarge() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div style={{ position: 'relative' }}>
      <FarcasterSignInButton 
        style={{
          background: isHovered 
            ? 'linear-gradient(45deg, #7b7fee 0%, #8b5cc2 100%)' 
            : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '12px',
          padding: '1rem 2.5rem',
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isHovered 
            ? '0 12px 35px rgba(118, 75, 162, 0.4)' 
            : '0 8px 25px rgba(118, 75, 162, 0.3)',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          minWidth: '200px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  );
}
