// Create a new file: app/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useProfile } from '@farcaster/auth-kit'

interface AuthContextType {
  isAuthenticated: boolean
  profile: any
  isLoading: boolean
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated: fcAuth, profile: fcProfile } = useProfile()
  const [mounted, setMounted] = useState(false)
  const [persistedAuth, setPersistedAuth] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [effectiveProfile, setEffectiveProfile] = useState<any>(null)
  const [effectiveAuth, setEffectiveAuth] = useState(false)

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize from localStorage on mount
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fc_auth_state')
        if (stored) {
          const parsed = JSON.parse(stored)
          // Check if stored auth is still valid (within 24 hours)
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setPersistedAuth(parsed)
            setEffectiveAuth(true)
            setEffectiveProfile(parsed.profile)
            console.log('Restored auth from localStorage:', parsed.profile?.username, 'FID:', parsed.profile?.fid)
          } else {
            // Clear expired auth
            localStorage.removeItem('fc_auth_state')
            console.log('Cleared expired auth from localStorage')
          }
        }
      } catch (e) {
        console.error('Auth restore failed:', e)
        localStorage.removeItem('fc_auth_state')
      }
      setIsLoading(false)
    }
  }, [mounted])

  // Sync Farcaster auth state to localStorage and update effective state
  useEffect(() => {
    if (mounted && fcAuth && fcProfile) {
      const newState = {
        isAuthenticated: true,
        profile: fcProfile,
        timestamp: Date.now()
      }
      setPersistedAuth(newState)
      setEffectiveAuth(true)
      setEffectiveProfile(fcProfile)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('fc_auth_state', JSON.stringify(newState))
        console.log('Saved auth to localStorage:', fcProfile.username, 'FID:', fcProfile.fid)
      }
    }
  }, [fcAuth, fcProfile, mounted])

  // Handle sign out
  useEffect(() => {
    if (mounted && !fcAuth && !fcProfile && persistedAuth) {
      // Only clear if we had auth before but now don't
      setPersistedAuth(null)
      setEffectiveAuth(false)
      setEffectiveProfile(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fc_auth_state')
        console.log('Cleared auth from localStorage due to sign out')
      }
    }
  }, [fcAuth, fcProfile, persistedAuth, mounted])

  const refreshAuth = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fc_auth_state')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setPersistedAuth(parsed)
            setEffectiveAuth(true)
            setEffectiveProfile(parsed.profile)
            console.log('Refreshed auth from localStorage:', parsed.profile?.username, 'FID:', parsed.profile?.fid)
          }
        } catch (e) {
          console.error('Auth refresh failed:', e)
        }
      }
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: effectiveAuth,
      profile: effectiveProfile,
      isLoading,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
