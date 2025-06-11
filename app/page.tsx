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
                Conn
