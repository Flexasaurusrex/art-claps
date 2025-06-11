export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff, #faf5ff)', padding: '64px 24px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '24px' }}>
          Art Claps
        </h1>
        <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '32px' }}>
          Support artists on Farcaster and earn rewards for building community
        </p>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>Platform Ready! 🎉</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Database connected and ready to go!
          </p>
          <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '8px' }}>
            <p style={{ color: '#166534', fontWeight: '500' }}>✅ Successfully Deployed</p>
            <p style={{ color: '#16a34a', fontSize: '14px' }}>✅ Database Connected</p>
            <p style={{ color: '#16a34a', fontSize: '14px' }}>⬜ Authentication (Coming Next)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
