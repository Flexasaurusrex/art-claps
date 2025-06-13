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
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg lg:text-xl px-4">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-12 gap-4">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
          <a href="/" className="text-white no-underline hover:text-purple-200 transition-colors">
            Art Claps
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          <img 
            src={profile.pfpUrl} 
            alt={profile.displayName}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/30"
          />
          <div className="text-white">
            <div className="font-semibold text-sm sm:text-base">{profile.displayName}</div>
            <div className="text-xs sm:text-sm opacity-80">@{profile.username}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12 text-center">
          
          {status === 'idle' ? (
            <>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 lg:mb-6">
                🎨 Become a Verified Artist
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-8 lg:mb-12 leading-relaxed max-w-2xl mx-auto">
                Join Art Claps as a verified artist and start receiving support from the Farcaster community. 
                Get claps, build your audience, and connect with fellow creators.
              </p>

              <form onSubmit={handleSubmit} className="text-left">
                
                {/* Referral Code Section */}
                <div className="mb-6 lg:mb-8">
                  <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                    🎟️ Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    placeholder="Enter referral code for instant verification"
                    className="w-full p-3 sm:p-4 rounded-xl border-none bg-white/10 text-white text-sm sm:text-base backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <p className="text-xs sm:text-sm text-white/60 mt-2">
                    Have a code from a verified artist? Enter it above for instant verification!
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center my-6 lg:my-8 text-white/60">
                  <div className="flex-1 h-px bg-white/20"></div>
                  <span className="mx-4 text-sm sm:text-base">OR</span>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>

                {/* Portfolio URL */}
                <div className="mb-6 lg:mb-8">
                  <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                    🖼️ Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleInputChange}
                    placeholder="https://your-portfolio.com"
                    className="w-full p-3 sm:p-4 rounded-xl border-none bg-white/10 text-white text-sm sm:text-base backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>

                {/* Application Message */}
                <div className="mb-6 lg:mb-8">
                  <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                    ✨ Tell us about your art
                  </label>
                  <textarea
                    name="applicationMessage"
                    value={formData.applicationMessage}
                    onChange={handleInputChange}
                    placeholder="What kind of art do you create? Share your story, style, and what makes your work unique..."
                    rows={5}
                    className="w-full p-3 sm:p-4 rounded-xl border-none bg-white/10 text-white text-sm sm:text-base backdrop-blur-sm placeholder:text-white/50 resize-y focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>

                {/* Terms Checkbox */}
                <div className="mb-6 lg:mb-8 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 sm:w-5 sm:h-5 mt-1 accent-purple-500"
                  />
                  <label htmlFor="terms" className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    I agree to be a positive member of the Art Claps community and support fellow artists
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 sm:py-4 rounded-xl text-white text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 ${
                    isSubmitting 
                      ? 'bg-white/30 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? '🎨 Submitting Application...' : '🚀 Apply to Become Artist'}
                </button>
              </form>
            </>
          ) : (
            /* Success/Error States */
            <div>
              <div className="text-4xl lg:text-5xl mb-4 lg:mb-6">
                {status === 'referral_success' ? '🎉' : status === 'success' ? '✨' : '❌'}
              </div>
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-6">
                {status === 'referral_success' ? 'Welcome, Verified Artist!' :
                 status === 'success' ? 'Application Submitted!' :
                 'Application Error'}
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 lg:mb-8 leading-relaxed max-w-2xl mx-auto">
                {message}
              </p>

              {status !== 'error' && (
                <p className="text-sm sm:text-base text-white/60">
                  Redirecting you in a moment...
                </p>
              )}

              {status === 'error' && (
                <button
                  onClick={() => setStatus('idle')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-white text-sm sm:text-base font-semibold cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Cards */}
        {status === 'idle' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-8 lg:mt-12">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 text-center">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">⚡</div>
              <h3 className="text-white text-base sm:text-lg font-semibold mb-2 lg:mb-3">
                Instant with Referral
              </h3>
              <p className="text-white/70 text-xs sm:text-sm lg:text-base leading-relaxed">
                Get verified instantly with a code from existing artists
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 text-center">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">🎯</div>
              <h3 className="text-white text-base sm:text-lg font-semibold mb-2 lg:mb-3">
                Curated Community
              </h3>
              <p className="text-white/70 text-xs sm:text-sm lg:text-base leading-relaxed">
                We manually review applications to maintain quality
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">💎</div>
              <h3 className="text-white text-base sm:text-lg font-semibold mb-2 lg:mb-3">
                Exclusive Benefits
              </h3>
              <p className="text-white/70 text-xs sm:text-sm lg:text-base leading-relaxed">
                Receive claps, build audience, invite other artists
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
