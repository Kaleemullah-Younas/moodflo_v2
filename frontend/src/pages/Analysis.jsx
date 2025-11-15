import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiService } from '../services/api'
import MetricCard from '../components/MetricCard'
import { LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { getEmotionColor, getRiskColor, formatDuration, emotionConfig } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Analysis() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)
  const analysisInProgressRef = useRef(false)

  useEffect(() => {
    if (sessionId && !hasStarted && !analysisInProgressRef.current) {
      setHasStarted(true)
      analysisInProgressRef.current = true
      startAnalysis()
    }
  }, [sessionId])

  const startAnalysis = async () => {
    setAnalyzing(true)
    
    try {
      // Start analysis
      const response = await apiService.startAnalysis(sessionId)
      setResults(response.results)
      toast.success('Analysis complete!')
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
      setLoading(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      toast.loading('Generating PDF report...')
      const blob = await apiService.exportPdf(sessionId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `moodflo_report_${sessionId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success('PDF report downloaded!')
    } catch (error) {
      toast.dismiss()
      toast.error('Export failed')
      console.error('Export error:', error)
    }
  }

  const handleExportJson = async () => {
    try {
      toast.loading('Generating JSON export...')
      const data = await apiService.exportJson(sessionId)
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `moodflo_report_${sessionId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success('JSON export downloaded!')
    } catch (error) {
      toast.dismiss()
      toast.error('Export failed')
      console.error('Export error:', error)
    }
  }

  if (loading || analyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-400">Analyzing meeting emotions...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a minute</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">No analysis data available</p>
          <Link to="/" className="mt-4 inline-block btn-primary">
            Upload New Recording
          </Link>
        </div>
      </div>
    )
  }

  const { summary, timeline, clusters, suggestions, duration } = results

  // Prepare chart data
  const timelineData = timeline.map(point => ({
    time: (point.time / 60).toFixed(2),
    energy: point.energy,
    category: point.category,
  }))

  const distributionData = Object.entries(summary.distribution).map(([emotion, percentage]) => ({
    name: emotion.split(' ')[1] || emotion,
    value: parseFloat(percentage.toFixed(1)),
    fullName: emotion,
  }))

  const metricsData = [
    { metric: 'Energy', value: summary.avg_energy },
    { metric: 'Participation', value: summary.participation },
    { metric: 'Silence', value: 100 - summary.silence_pct },
    { metric: 'Engagement', value: summary.volatility * 10 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              📊 Overall Analysis
            </h1>
            <p className="text-gray-400">
              Duration: {formatDuration(duration)} • Session: {sessionId.substring(0, 8)}...
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleExportPdf}
              className="btn-secondary flex items-center space-x-2"
              title="Download PDF Report"
            >
              <span>📄</span>
              <span>Export PDF</span>
            </button>
            
            <button
              onClick={handleExportJson}
              className="btn-secondary flex items-center space-x-2"
              title="Download JSON Data"
            >
              <span>💾</span>
              <span>Export JSON</span>
            </button>
            
            <Link
              to={`/live/${sessionId}`}
              className="btn-primary flex items-center space-x-2"
            >
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span>Live Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards - 3 columns layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Dominant Emotion"
          value={summary.dominant_emotion.split(' ')[1] || summary.dominant_emotion}
          icon={summary.dominant_emotion.split(' ')[0]}
          color={getEmotionColor(summary.dominant_emotion)}
        />
        
        <MetricCard
          title="Silence Percentage"
          value={`${Math.round(summary.silence_pct)}%`}
          subtitle="Quiet moments detected"
        />
        
        <MetricCard
          title="Average Energy"
          value={Math.round(summary.avg_energy)}
          subtitle="0-100 intensity scale"
        />
        
        <MetricCard
          title="Participation Rate"
          value={`${Math.round(summary.participation)}%`}
          subtitle="Active speaking time"
        />
        
        <MetricCard
          title="Volatility Score"
          value={summary.volatility.toFixed(1)}
          subtitle="0-10 emotion stability"
        />
        
        <MetricCard
          title="Psych Safety Risk"
          value={summary.psych_risk}
          color={getRiskColor(summary.psych_risk)}
          subtitle="Team safety indicator"
        />
      </div>

      {/* Complete Emotion Timeline - Full Width */}
      <div className="chart-container mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">📈</span>
          Complete Emotion Timeline
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineData}>
            <defs>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
              stroke="#9ca3af"
              interval={Math.ceil(timelineData.length / 20)}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Energy Level', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#667eea"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#764ba2' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution and Metrics Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Distribution Pie */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Emotion Distribution
          </h2>
          <ResponsiveContainer width="100%" height={350}>
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
              >
                {distributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getEmotionColor(entry.fullName)}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Bar */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Metrics Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={metricsData}>
              <defs>
                <linearGradient id="colorBar1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#764ba2" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorBar2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f093fb" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#f5576c" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorBar3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4facfe" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorBar4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#43e97b" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#38f9d7" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="metric" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {metricsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#colorBar${index + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clustering and Energy Trajectory Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Cluster Scatter */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">👥</span>
            Team Clustering
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" dataKey="x" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis type="number" dataKey="y" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #667eea', 
                  borderRadius: '8px',
                  padding: '12px'
                }}
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                itemStyle={{ color: '#ffffff' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const clusterLabel = payload[0].payload.label;
                    const descriptions = clusters.description.split(' | ');
                    const description = descriptions[clusterLabel] || `Cluster ${clusterLabel}`;
                    return (
                      <div style={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #667eea', 
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <p style={{ color: '#ffffff', margin: 0, fontWeight: 'bold' }}>
                          {description}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Emotion Clusters"
                data={clusters.coordinates.map((coord, i) => ({
                  x: coord[0],
                  y: coord[1],
                  label: clusters.labels[i],
                }))}
              >
                {clusters.coordinates.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={[
                    '#667eea', '#f093fb', '#4facfe', '#43e97b', '#ffa500'
                  ][clusters.labels[index] % 5]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">{clusters.description}</p>
        </div>

        {/* Energy Trajectory */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Energy Trajectory
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                interval={Math.ceil(timelineData.length / 15)}
                tick={{ fontSize: 12 }}
                label={{ value: 'Time (min)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
              />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#667eea"
                strokeWidth={2}
                fill="url(#colorArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="chart-container border-l-4 border-primary-500 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">💡</span>
          AI-Powered Insights
        </h2>
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-gray-300 font-sans leading-relaxed">
            {suggestions}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-8 border-t border-gray-800">
        <p>🔒 Privacy Protected: Only voice tone analyzed. No content recorded or stored.</p>
      </div>
    </div>
  )
}
