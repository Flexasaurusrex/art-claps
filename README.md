# Art Claps - Support Artists on Farcaster

A Tight SocialFi platform that rewards community members for supporting and discovering artists on Farcaster.

## 🚀 Quick Deploy to Vercel

1. **Set up Supabase database:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project: "Art Claps"
   - Copy connection string from Settings > Database

2. **Set up Farcaster OAuth:**
   - Go to [warpcast.com/~/developers](https://warpcast.com/~/developers)
   - Create new app: "Art Claps"
   - Set redirect URI: `https://yourapp.vercel.app/api/auth/callback/farcaster`
   - Copy Client ID and Secret

3. **Deploy to Vercel:**
   - Connect this GitHub repo to Vercel
   - Add environment variables (see below)
   - Deploy!

4. **Initialize database:**
   - After first deploy, run: `npx prisma db push`

## 🔧 Environment Variables

Add these in Vercel dashboard (Settings > Environment Variables):

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
NEXTAUTH_URL="https://yourapp.vercel.app"
NEXTAUTH_SECRET="generate-a-strong-secret"
FARCASTER_CLIENT_ID="your-client-id"
FARCASTER_CLIENT_SECRET="your-client-secret"
ADMIN_API_KEY="generate-admin-key"
