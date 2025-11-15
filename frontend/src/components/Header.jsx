import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-4xl">🎭</div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                Moodflo
              </h1>
              <p className="text-xs text-gray-400">Real-time Emotion Analytics</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Live Analysis Ready
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
