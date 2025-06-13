// app/api/profile/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ArtistLink {
  label: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, extendedBio, artistLinks }: { 
      fid: string; 
      extendedBio?: string; 
      artistLinks?: ArtistLink[] 
    } = body;

    if (!fid) {
      return NextResponse.json(
        { success: false, error: 'Missing FID' }, 
        { status: 400 }
      );
    }

    // Validate artist links format
    if (artistLinks && !Array.isArray(artistLinks)) {
      return NextResponse.json(
        { success: false, error: 'Artist links must be an array' }, 
        { status: 400 }
      );
    }

    // Validate each link has required fields
    if (artistLinks) {
      for (const link of artistLinks as ArtistLink[]) {
        if (!link.label || !link.url) {
          return NextResponse.json(
            { success: false, error: 'Each link must have a label and URL' }, 
            { status: 400 }
          );
        }
        
        // Basic URL validation
        try {
          new URL(link.url);
        } catch {
          return NextResponse.json(
            { success: false, error: `Invalid URL: ${link.url}` }, 
            { status: 400 }
          );
        }
      }
    }

    // Get user by FID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, farcasterFid')
      .eq('farcasterFid', parseInt(fid))
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Update user profile
    const updateData: {
      extendedBio?: string;
      artistLinks?: ArtistLink[];
    } = {};
    
    if (extendedBio !== undefined) {
      updateData.extendedBio = extendedBio.trim();
    }
    
    if (artistLinks !== undefined) {
      updateData.artistLinks = artistLinks.filter((link: ArtistLink) => 
        link.label && link.label.trim() && link.url && link.url.trim()
      );
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' }, 
        { status: 500 }
      );
    }

    // Record activity for profile update
    await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        type: 'profile_updated',
        points: 0,
        description: 'Updated profile information',
        metadata: { 
          updatedFields: Object.keys(updateData),
          fid: parseInt(fid)
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error in profile edit API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
