'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '@farcaster/auth-kit';
import { useRouter } from 'next/navigation';

interface Artist {
  id: string;
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  verifiedArtist: boolean;
  claps: number;
  totalActivities: number;
  connections: number;
  alreadyClappedToday: boolean;
}

interface UserStats {
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  supportGiven: number;
  supportReceived: number;
}

export default function DiscoverPage() {
  const { isAuthenticated, profile } = useProfile();
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<{[key: number]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userRole, setUserRole] = useState<'supporter' | 'verified_artist' | 'admin'>('supporter');
  const [syncingFarcaster, setSyncingFarcaster] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user is admin (FID 7418)
  const
