"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

interface UserStats {
  totalPoints: number
  weeklyPoints: number
  rank: number
  supportRatio: number
  artistsSupported: number
}

export default function Home() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchUserStats()
    }
  }, [session])

  const fetchUserStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
    setLoading(false)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Art Claps
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Support artists on Farcaster and earn rewards for building community
            </p>
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">
                Connect your Farcaster account to start earning points for supporting artists
              </p>
              <button
                onClick={() => signIn("farcaster")}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Connect with Farcaster
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Art Claps</h1>
            <div className="flex items-center gap-4">
              <img
                src={session.user.image || '/default-avatar.png'}
                alt="Profile"
                className="w-10 h-10 rounded-lg"
              />
              <span className="font-medium">{session.user.name}</span>
              <button
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {session.user.name}</h2>
          <p className="text-gray-600">Your community impact is growing. Here's what's happening.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading your stats...</div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl">
              <div className="text-sm font-semibold opacity-90 mb-2">CLAPS SCORE</div>
              <div className="text-3xl font-bold mb-1">{stats.totalPoints.toLocaleString()}</div>
              <div className="text-sm opacity-90">+{stats.weeklyPoints} this week</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-sm font-semibold text-gray-500 mb-2">SUPPORT RATIO</div>
              <div className="text-3xl font-bold mb-1">{stats.supportRatio}x</div>
              <div className="text-sm text-green-600">Balanced giver</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-sm font-semibold text-gray-500 mb-2">COMMUNITY RANK</div>
              <div className="text-3xl font-bold mb-1">#{stats.rank}</div>
              <div className="text-sm text-green-600">Rising</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-sm font-semibold text-gray-500 mb-2">ARTISTS SUPPORTED</div>
              <div className="text-3xl font-bold mb-1">{stats.artistsSupported}</div>
              <div className="text-sm text-green-600">+3 this week</div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Welcome to Art Claps!</h3>
            <p className="text-gray-600 mb-6">
              Start supporting artists on Farcaster to earn your first points. 
              We're tracking your activity now!
            </p>
            <button
              onClick={fetchUserStats}
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Refresh Stats
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">How to Earn Points</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">👏</div>
                <div>
                  <div className="font-medium">Share artist's work</div>
                  <div className="text-sm text-gray-600">10 points + multipliers</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">💬</div>
                <div>
                  <div className="font-medium">Leave thoughtful replies</div>
                  <div className="text-sm text-gray-600">15 points</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">🎨</div>
                <div>
                  <div className="font-medium">Get your work shared</div>
                  <div className="text-sm text-gray-600">8 points per share</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
            <div className="space-y-3">
              <div className="text-gray-600">🏆 Community leaderboards</div>
              <div className="text-gray-600">📊 Advanced analytics</div>
              <div className="text-gray-600">🤝 Artist collaboration finder</div>
              <div className="text-gray-600">📱 Farcaster mini-app</div>
              <div className="text-gray-600">🪙 Token rewards (TGE)</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
