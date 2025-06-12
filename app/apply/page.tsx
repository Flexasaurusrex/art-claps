'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';
import { useRouter } from 'next/navigation';

export default function ApplyPage() {
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();
  const [formData, setFormData] = useState({
    portfolioUrl: '',
    referralCode: '',
    applicationMessage: '',
    agreedToTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'referral_success'>('idle');
  const [message, setMessage] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreedToTerms) {
      setStatus('error');
      setMessage('Please agree to the terms and conditions');
      return;
    }

    if (!formData.referralCode && !formData.applicationMessage) {
      setStatus('error');
      setMessage('Please provide either a referral code or tell us about your art');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farcasterFid: profile?.fid,
          username: profile?.username,
          displayName: profile?.displayName,
          pfpUrl: profile?.pfpUrl,
          bio: profile?.bio,
          portfolioUrl: formData.portfolioUrl,
          referralCode: formData.referralCode,
          applicationMessage: formData.applicationMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        const isInstantVerification = data.user.artistStatus === 'verified_artist';
        setStatus(isInstantVerification ? 'referral_success' : 'success');
        setMessage(data.message);
        
        // Redirect after success
        setTimeout(() => {
          router.push(isInstantVerification ? '/discover' : '/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Application failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isAuthenticated || !profile) {
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
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem'
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
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          
          {status === 'idle' ? (
            <>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: 'white',
                marginBottom: '1rem'
              }}>
                🎨 Become a Verified Artist
              </h1>
              
              <p style={{
                fontSize: '1.2rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '3rem',
                lineHeight: '1.6'
              }}>
                Join Art Claps as a verified artist and start receiving support from the Farcaster community. 
                Get claps, build your audience, and connect with fellow creators.
              </p>

              <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                
                {/* Referral Code Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    🎟️ Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    placeholder="Enter referral code for instant verification"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '0.5rem'
                  }}>
                    Have a code from a verified artist? Enter it above for instant verification!
                  </p>
                </div>

                {/* Divider */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '2rem 0',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
                  <span style={{ margin: '0 1rem' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
                </div>

                {/* Portfolio URL */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    🖼️ Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleInputChange}
                    placeholder="https://your-portfolio.com"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                </div>

                {/* Application Message */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    ✨ Tell us about your art
                  </label>
                  <textarea
                    name="applicationMessage"
                    value={formData.applicationMessage}
                    onChange={handleInputChange}
                    placeholder="What kind of art do you create? Share your story, style, and what makes your work unique..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      backdropFilter: 'blur(10px)',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Terms Checkbox */}
                <div style={{ 
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                    style={{
                      width: '18px',
                      height: '18px'
                    }}
                  />
                  <label htmlFor="terms" style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem'
                  }}>
                    I agree to be a positive member of the Art Claps community and support fellow artists
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: isSubmitting 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isSubmitting ? '🎨 Submitting Application...' : '🚀 Apply to Become Artist'}
                </button>
              </form>
            </>
          ) : (
            /* Success/Error States */
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                {status === 'referral_success' ? '🎉' : status === 'success' ? '✨' : '❌'}
              </div>
              
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '1rem'
              }}>
                {status === 'referral_success' ? 'Welcome, Verified Artist!' :
                 status === 'success' ? 'Application Submitted!' :
                 'Application Error'}
              </h2>
              
              <p style={{
                fontSize: '1.2rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                {message}
              </p>

              {status !== 'error' && (
                <p style={{
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Redirecting you in a moment...
                </p>
              )}

              {status === 'error' && (
                <button
                  onClick={() => setStatus('idle')}
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
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Cards */}
        {status === 'idle' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '3rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Instant with Referral
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Get verified instantly with a code from existing artists
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Curated Community
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                We manually review applications to maintain quality
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💎</div>
              <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Exclusive Benefits
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Receive claps, build audience, invite other artists
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
