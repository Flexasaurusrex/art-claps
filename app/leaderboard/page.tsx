'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardUser {
  id: string;
  farcasterFid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  artistStatus: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  follower_count: number;
  rank: number;
  points: number;
}

interface LeaderboardStats {
  totalUsers: number;
  totalPointsAwarded: number;
  averagePoints: number;
  period: string;
}

export default function LeaderboardPage() {
  const { isAuthenticated, profile, refreshAuth } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, profile]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const currentUserFid = profile?.fid || '';
      const response = await fetch(`/api/leaderboard?period=${period}&currentUserFid=${currentUserFid}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setStats(data.data.stats);
        setCurrentUserRank(data.data.currentUserRank);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodTitle = () => {
    switch (period) {
      case 'weekly': return 'Weekly Champions';
      case 'monthly': return 'Monthly Legends';
      default: return 'All-Time Heroes';
    }
  };

  const getPeriodIcon = () => {
    switch (period) {
      case 'weekly': return '⚡';
      case 'monthly': return '🌟';
      default: return '👑';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600 text-yellow-900';
      case 2: return 'from-gray-300 to-gray-500 text-gray-900';
      case 3: return 'from-amber-600 to-amber-800 text-amber-100';
      default: return 'from-purple-500/20 to-pink-500/20 text-white';
    }
  };

  const getUserRole = (user: LeaderboardUser) => {
    if (user.farcasterFid === 7418) return { icon: '👑', label: 'Admin', color: 'text-yellow-400' };
    if (user.artistStatus === 'verified_artist') return { icon: '✓', label: 'Artist', color: 'text-green-400' };
    return { icon: '🎨', label: 'Creator', color: 'text-blue-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center px-4">
        <div className="text-white text-lg lg:text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 lg:py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/discover')}
            className="text-white hover:text-purple-200 transition-colors cursor-pointer bg-transparent border-none text-sm lg:text-base flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="hidden sm:inline">Back to Discover</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          <Link href="/" className="text-white hover:text-purple-200 transition-colors text-sm lg:text-base">
            Art Claps
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-12">
        
        {/* Leaderboard Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="text-6xl lg:text-8xl mb-4">🏆</div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4">
            CLAPS Leaderboard
          </h1>
          <p className="text-lg lg:text-xl text-purple-200 mb-6">
            Celebrating our most active creators and supporters
          </p>

          {/* Period Selector */}
          <div className="flex justify-center gap-2 sm:gap-4 mb-8">
            {[
              { key: 'all', label: 'All-Time', icon: '👑' },
              { key: 'monthly', label: 'Monthly', icon: '🌟' },
              { key: 'weekly', label: 'Weekly', icon: '⚡' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setPeriod(key as any)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${
                  period === key
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 shadow-lg'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 lg:p-6 text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-white/60 text-sm lg:text-base">Active Creators</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 lg:p-6 text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {stats.totalPointsAwarded.toLocaleString()}
              </div>
              <div className="text-white/60 text-sm lg:text-base">Total CLAPS</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 lg:p-6 text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {stats.averagePoints.toLocaleString()}
              </div>
              <div className="text-white/60 text-sm lg:text-base">Average Points</div>
            </div>
          </div>
        )}

        {/* Current User Rank */}
        {isAuthenticated && currentUserRank && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-2xl p-4 lg:p-6 mb-8 text-center">
            <div className="text-white/80 text-sm lg:text-base mb-2">Your Current Rank</div>
            <div className="text-2xl lg:text-4xl font-bold text-white">
              #{currentUserRank.toLocaleString()}
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-white text-center mb-6 lg:mb-8">
              {getPeriodIcon()} {getPeriodTitle()}
            </h2>
            
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 lg:gap-8 max-w-4xl mx-auto">
              {/* 2nd Place */}
              <div className="order-1 md:order-1 w-full md:w-1/3">
                <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl p-4 lg:p-6 text-center relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <img
                    src={users[1].pfpUrl}
                    alt={users[1].displayName}
                    className="w-16 lg:w-20 h-16 lg:h-20 rounded-full mx-auto mb-3 border-4 border-gray-200"
                  />
                  <h3 className="font-bold text-gray-900 mb-1 text-sm lg:text-base truncate">
                    {users[1].displayName}
                  </h3>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {users[1].points.toLocaleString()}
                  </div>
                  <div className="text-gray-700 text-xs lg:text-sm">CLAPS</div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-2 md:order-2 w-full md:w-1/3">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 lg:p-8 text-center relative transform md:scale-110">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-yellow-900 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl">
                    👑
                  </div>
                  <img
                    src={users[0].pfpUrl}
                    alt={users[0].displayName}
                    className="w-20 lg:w-24 h-20 lg:h-24 rounded-full mx-auto mb-4 border-4 border-yellow-200"
                  />
                  <h3 className="font-bold text-yellow-900 mb-2 text-base lg:text-lg truncate">
                    {users[0].displayName}
                  </h3>
                  <div className="text-3xl lg:text-4xl font-bold text-yellow-900">
                    {users[0].points.toLocaleString()}
                  </div>
                  <div className="text-yellow-800 text-sm lg:text-base">CLAPS</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 md:order-3 w-full md:w-1/3">
                <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-4 lg:p-6 text-center relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-amber-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <img
                    src={users[2].pfpUrl}
                    alt={users[2].displayName}
                    className="w-16 lg:w-20 h-16 lg:h-20 rounded-full mx-auto mb-3 border-4 border-amber-200"
                  />
                  <h3 className="font-bold text-amber-100 mb-1 text-sm lg:text-base truncate">
                    {users[2].displayName}
                  </h3>
                  <div className="text-2xl lg:text-3xl font-bold text-amber-100">
                    {users[2].points.toLocaleString()}
                  </div>
                  <div className="text-amber-200 text-xs lg:text-sm">CLAPS</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl lg:rounded-3xl overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-white/10">
            <h2 className="text-xl lg:text-2xl font-bold text-white">Complete Rankings</h2>
          </div>
          
          <div className="max-h-96 lg:max-h-[500px] overflow-y-auto">
            {users.map((user) => {
              const role = getUserRole(user);
              const isCurrentUser = profile?.fid === user.farcasterFid;
              
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 lg:p-6 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    isCurrentUser ? 'bg-blue-500/20 border-blue-500/30' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center font-bold text-sm lg:text-base bg-gradient-to-br ${getRankStyle(user.rank)}`}>
                    {getRankIcon(user.rank)}
                  </div>
                  
                  {/* Profile Picture */}
                  <Link href={`/artist/${user.username}`}>
                    <img
                      src={user.pfpUrl}
                      alt={user.displayName}
                      className="w-12 h-12 lg:w-16 lg:h-16 rounded-full border-2 border-purple-400 hover:border-purple-300 transition-colors cursor-pointer"
                    />
                  </Link>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/artist/${user.username}`}>
                        <h3 className="font-bold text-white hover:text-purple-200 transition-colors cursor-pointer text-sm lg:text-base truncate">
                          {user.displayName}
                        </h3>
                      </Link>
                      <span className={`text-xs ${role.color}`} title={role.label}>
                        {role.icon}
                      </span>
                      {isCurrentUser && (
                        <span className="bg-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs lg:text-sm">@{user.username}</p>
                  </div>
                  
                  {/* Points */}
                  <div className="text-right">
                    <div className="text-lg lg:text-xl font-bold text-white">
                      {user.points.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-xs lg:text-sm">CLAPS</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8 lg:mt-12">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-2xl p-6 lg:p-8 mb-6">
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">
              Ready to Climb the Rankings?
            </h3>
            <p className="text-white/80 mb-6 text-sm lg:text-base">
              Earn CLAPS by supporting artists, following creators, and being active in the community!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/discover')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                Discover Artists
              </button>
              <button
                onClick={() => router.push('/apply')}
                className="bg-white/10 border border-white/20 text-white font-medium py-3 px-6 rounded-xl hover:bg-white/20 transition-all duration-300"
              >
                Become an Artist
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
