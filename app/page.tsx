export default function Home() {
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
            <h2 className="text-2xl font-semibold mb-4">Database Connected! 🎉</h2>
            <p className="text-gray-600 mb-6">
              Platform is ready - authentication coming next!
            </p>
            <div className="bg-indigo-100 p-4 rounded-lg">
              <p className="text-indigo-800 font-medium">✅ Database Setup Complete</p>
              <p className="text-indigo-600 text-sm">Ready for user registration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
