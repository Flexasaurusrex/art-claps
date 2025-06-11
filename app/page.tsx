export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Art Claps
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Support artists on Farcaster and earn rewards for building community
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Platform Ready! 🎉</h2>
            <p className="text-gray-600 mb-4">
              Database connected and ready to go!
            </p>
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-green-800 font-medium">✅ Successfully Deployed</p>
              <p className="text-green-600 text-sm">✅ Database Connected</p>
              <p className="text-green-600 text-sm">⬜ Authentication (Coming Next)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
