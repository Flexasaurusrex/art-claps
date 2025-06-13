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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 lg:p-12 gap-4">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
          Art Claps
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
          <a 
            href="/apply"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 no-underline text-sm sm:text-base shadow-lg"
          >
            🎨 Apply as Artist
          </a>
          <SignInButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pb-16 text-center max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-12 lg:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-6 lg:mb-8 leading-tight tracking-tight">
            <span className="text-white block mb-2">
              Support Artists.
            </span>
            <span className="bg-gradient-to-r from-yellow-400 via-red-500 via-teal-400 via-blue-500 via-green-400 to-pink-500 bg-clip-text text-transparent inline-block">
              Earn Rewards.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-2xl lg:max-w-4xl mx-auto leading-relaxed font-normal px-4 mb-8">
            The SocialFi platform where supporting Farcaster artists earns you points, builds community, and rewards authentic engagement.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center">
            <SignInButton />
            <a 
              href="/apply"
              className="bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 hover:scale-105 no-underline text-sm sm:text-base shadow-lg"
            >
              🎨 Apply to Become Artist
            </a>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8 w-full max-w-5xl mb-12 lg:mb-16">
          
          {/* Clap to Earn */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 lg:p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 cursor-pointer">
            <div className="text-4xl lg:text-5xl mb-4 lg:mb-6 drop-shadow-lg">
              👏
            </div>
            <h3 className="text-white text-xl lg:text-2xl font-bold mb-3 lg:mb-4">
              Clap to Earn
            </h3>
            <p className="text-white/80 text-sm lg:text-base leading-relaxed">
              Support artists and earn points for genuine engagement
            </p>
          </div>

          {/* Discover Artists */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 lg:p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 cursor-pointer">
            <div className="text-4xl lg:text-5xl mb-4 lg:mb-6 drop-shadow-lg">
              🎨
            </div>
            <h3 className="text-white text-xl lg:text-2xl font-bold mb-3 lg:mb-4">
              Discover Artists
            </h3>
            <p className="text-white/80 text-sm lg:text-base leading-relaxed">
              Find and connect with amazing creators on Farcaster
            </p>
          </div>

          {/* Build Reputation */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 lg:p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 cursor-pointer">
            <div className="text-4xl lg:text-5xl mb-4 lg:mb-6 drop-shadow-lg">
              🏆
            </div>
            <h3 className="text-white text-xl lg:text-2xl font-bold mb-3 lg:mb-4">
              Build Reputation
            </h3>
            <p className="text-white/80 text-sm lg:text-base leading-relaxed">
              Climb the leaderboard as a true community supporter
            </p>
          </div>

          {/* Unlock Rewards */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 lg:p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-white/15 cursor-pointer">
            <div className="text-4xl lg:text-5xl mb-4 lg:mb-6 drop-shadow-lg">
              💎
            </div>
            <h3 className="text-white text-xl lg:text-2xl font-bold mb-3 lg:mb-4">
              Unlock Rewards
            </h3>
            <p className="text-white/80 text-sm lg:text-base leading-relaxed">
              Redeem points for exclusive artist collaborations
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl p-6 lg:p-12 text-center max-w-2xl w-full mx-4">
          <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 lg:mb-6">
            Ready to start supporting artists?
          </h2>
          
          <p className="text-white/80 text-base sm:text-lg lg:text-xl mb-6 lg:mb-8 leading-relaxed px-2">
            Connect your Farcaster account to join the Art Claps community and start earning rewards for authentic engagement.
          </p>

          <div className="flex flex-col gap-4 lg:gap-6 items-center">
            <SignInButton />
            
            <div className="text-white/60 text-sm">
              Or if you're an artist...
            </div>
            
            {/* Apply to Become Artist Button */}
            <a 
              href="/apply"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 hover:scale-105 no-underline text-sm sm:text-base shadow-lg"
            >
              🎨 Apply to Become Verified Artist
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 lg:mt-16 text-sm lg:text-base text-white/60 text-center px-4">
          🚀 Now in beta • Building the future of artist support on Farcaster
        </div>
      </main>
    </div>
  );
}
