import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { WebSocketService, apiService } from '../services/api'
import MetricCard from '../components/MetricCard'
import { LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getEmotionColor, formatTime } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function LiveDashboard() {
  const { sessionId } = useParams()
  const [wsService, setWsService] = useState(null)
  const [connected, setConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [realtimeData, setRealtimeData] = useState(null)
  const [duration, setDuration] = useState(0)
  const [timeline, setTimeline] = useState([])
  const [videoUrl, setVideoUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)
  const wsInitializedRef = useRef(false)
  const currentSessionRef = useRef(null)

  // Cleanup when session changes
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up LiveDashboard, closing WebSocket')
      if (wsService) {
        wsService.close()
      }
      wsInitializedRef.current = false
      currentSessionRef.current = null
    }
  }, [])

  useEffect(() => {
    // Reset if session changed
    if (currentSessionRef.current && currentSessionRef.current !== sessionId) {
      console.log('🔄 Session changed, resetting WebSocket')
      if (wsService) {
        wsService.close()
      }
      wsInitializedRef.current = false
      setConnected(false)
      setWsService(null)
    }
    currentSessionRef.current = sessionId
    
    // Prevent multiple connections
    if (wsInitializedRef.current) return
    wsInitializedRef.current = true
    
    // Fetch video URL
    setVideoUrl(`http://localhost:8000/api/video/${sessionId}`)

    // Initialize WebSocket
    const ws = new WebSocketService(sessionId)
    setWsService(ws)

    // Connect
    ws.connect()
      .then(() => {
        console.log('WebSocket connected, waiting for stream initialization...')
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error)
        // Don't show error toast - wait for ready event or actual error event
      })

    // Listen for events
    ws.on('status', (data) => {
      console.log('📊 Status:', data.message)
    })
    
    ws.on('ready', (data) => {
      console.log('✅ Ready event received:', data)
      setDuration(data.duration)
      setConnected(true)
      toast.success('Real-time streaming ready!')
    })

    ws.on('update', (data) => {
      setRealtimeData(data.data)
      
      // Accumulate timeline data
      setTimeline(prev => {
        const newData = [...prev]
        if (data.data.timeline_length > newData.length) {
          newData.push({
            time: data.time,
            energy: data.data.current_energy,
            category: data.data.current_emotion,
          })
        }
        return newData
      })
    })

    ws.on('error', (data) => {
      console.error('WebSocket error:', data.message)
      toast.error(data.message)
    })

    // Cleanup
    return () => {
      ws.close()
    }
  }, [sessionId])

  // Video time tracking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)
      if (wsService && connected) {
        wsService.seek(time)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [wsService, connected])

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-400">Connecting to live stream...</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const timelineChartData = timeline.map(point => ({
    time: (point.time / 60).toFixed(2),
    energy: point.energy,
  }))

  const distributionData = realtimeData?.emotion_distribution
    ? Object.entries(realtimeData.emotion_distribution).map(([emotion, percentage]) => ({
        name: emotion.split(' ')[1] || emotion,
        value: parseFloat(percentage.toFixed(1)),
        fullName: emotion,
      }))
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></span>
              Live Dashboard
            </h1>
            <p className="text-gray-400">Real-time emotion analysis as the video plays</p>
          </div>
          
          <Link
            to={`/analysis/${sessionId}`}
            className="btn-secondary"
          >
            📊 View Overall Analysis
          </Link>
        </div>
      </div>

      {/* Video and KPIs Layout */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Video Player */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-bold mb-4">📹 Meeting Recording</h2>
          
          {/* Video Player */}
          <div className="bg-gray-900 rounded-lg aspect-video mb-4 overflow-hidden">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">Loading video...</p>
              </div>
            )}
          </div>
        </div>

        {/* Live KPIs */}
        <div>
          <h2 className="text-xl font-bold mb-4">🔑 Key Performance Indicators</h2>
          
          <div className="space-y-4">
            {/* Full-width Current Emotion */}
            <MetricCard
              title="Current Emotion"
              value={realtimeData?.current_emotion?.split(' ')[1] || 'N/A'}
              icon={realtimeData?.current_emotion?.split(' ')[0] || ''}
              color={getEmotionColor(realtimeData?.current_emotion)}
            />
            
            {/* 2x2 Grid for remaining metrics */}
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                title="Current Energy"
                value={realtimeData ? Math.round(realtimeData.current_energy) : 0}
                subtitle="Live reading"
              />
              
              <MetricCard
                title="Avg Energy"
                value={realtimeData ? Math.round(realtimeData.avg_energy) : 0}
                subtitle="Overall average"
              />
              
              <MetricCard
                title="Emotion Shifts"
                value={realtimeData?.emotion_shifts || 0}
                subtitle="Category changes"
              />
              
              <MetricCard
                title="Elapsed Time"
                value={formatTime(currentTime)}
                subtitle={`of ${formatTime(duration)}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Timeline - Full Width */}
      <div className="mb-8">
        <div className="chart-container hover:shadow-primary-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">📈</span>
            <span className="gradient-text">Live Emotion Timeline</span>
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineChartData}>
              <defs>
                <linearGradient id="liveGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="50%" stopColor="#764ba2" />
                  <stop offset="100%" stopColor="#f093fb" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                interval={Math.max(1, Math.ceil(timelineChartData.length / 20))}
              />
              <YAxis
                label={{ value: 'Energy', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #667eea',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="url(#liveGradient)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution + Energy Gauge Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Live Distribution */}
        <div className="chart-container hover:shadow-secondary-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            <span className="gradient-text">Live Distribution</span>
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            {distributionData.length > 0 ? (
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getEmotionColor(entry.fullName)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #667eea',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)'
                  }}
                />
              </PieChart>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Analyzing emotions...</p>
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Energy Gauge */}
        <div className="chart-container hover:shadow-green-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Energy Gauge
          </h2>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full text-white bg-gradient-to-r from-primary-500 to-secondary-500">
                  Live
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-white">
                  {realtimeData ? Math.round(realtimeData.current_energy) : 0}
                </span>
                <span className="text-lg text-gray-300">%</span>
              </div>
            </div>
            <div className="overflow-hidden h-6 mb-4 text-xs flex rounded-full bg-gray-700 shadow-inner">
              <div
                style={{ width: `${realtimeData?.current_energy || 0}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 transition-all duration-500 rounded-full animate-pulse"
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Real-time vocal energy intensity
          </p>
        </div>
      </div>

      {/* Running Average + Volatility Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Running Average */}
        <div className="chart-container hover:shadow-blue-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Running Average
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineChartData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#43e97b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#38f9d7" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                tick={{ fontSize: 10 }}
                interval={Math.max(1, Math.ceil(timelineChartData.length / 15))}
              />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #43e97b',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#43e97b"
                fill="url(#areaGradient)"
                fillOpacity={0.7}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volatility Indicator */}
        <div className="chart-container hover:shadow-orange-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🌊</span>
            Volatility
          </h2>
          <div className="text-center py-8">
            <div 
              className="text-6xl font-bold mb-3 transition-all duration-500" 
              style={{
                color: realtimeData?.volatility > 5 ? '#ffa500' : realtimeData?.volatility > 3 ? '#4facfe' : '#43e97b',
                textShadow: `0 0 20px ${realtimeData?.volatility > 5 ? '#ffa50080' : realtimeData?.volatility > 3 ? '#4facfe80' : '#43e97b80'}`
              }}
            >
              {realtimeData?.volatility?.toFixed(1) || '0.0'}
            </div>
            <p className="text-sm text-gray-400 font-semibold">
              {realtimeData?.volatility > 7 ? '⚠️ High emotional variability' :
               realtimeData?.volatility > 4 ? '📊 Moderate changes' :
               '✅ Stable emotions'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Attribution */}
      <div className="text-center text-gray-500 text-sm mt-12 pb-4">
        <p>Powered by advanced vocal emotion analysis</p>
      </div>
    </div>
  );
}
