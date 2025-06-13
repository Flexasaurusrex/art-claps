'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useProfile } from '@farcaster/auth-kit'

interface User {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio: string
  followerCount: number
  followingCount: number
  verifications: string[]
  artistStatus?: string
  totalPoints?: number
  weeklyPoints?: number
  monthlyPoints?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { profile } = useProfile()

  // Check for persisted user on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('art-claps-user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Error loading stored user:', error)
      localStorage.removeItem('art-claps-user')
    }
    setIsLoading(false)
  }, [])

  // Update user when profile changes
  useEffect(() => {
    if (profile && profile.fid && profile.username) {
      const userData: User = {
        fid: profile.fid,
        username: profile.username,
        displayName: profile.displayName || '',
        pfpUrl: profile.pfpUrl || '',
        bio: profile.bio || '',
        followerCount: profile.followerCount || 0,
        followingCount: profile.followingCount || 0,
        verifications: profile.verifications || [],
      }
      setUser(userData)
      localStorage.setItem('art-claps-user', JSON.stringify(userData))
    } else if (!isLoading) {
      // Only clear user if we're not loading (to avoid clearing on page refresh)
      setUser(null)
      localStorage.removeItem('art-claps-user')
    }
  }, [profile, isLoading])

  const logout = () => {
    setUser(null)
    localStorage.removeItem('art-claps-user')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setUser,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
