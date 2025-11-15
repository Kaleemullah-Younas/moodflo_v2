import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function Upload({ onUploadComplete }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.mp4', '.mp3', '.wav', '.avi', '.mov', '.mkv']
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      
      if (!allowedTypes.includes(fileExt)) {
        toast.error(`File type ${fileExt} not supported`)
        return
      }
      
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const result = await apiService.uploadFile(file, (progress) => {
        setUploadProgress(progress)
      })

      toast.success('File uploaded successfully!')
      onUploadComplete?.(result.session_id)
      
      // Store session ID and show choice modal
      setSessionId(result.session_id)
      setShowChoiceModal(true)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAnalysisChoice = (type) => {
    setShowChoiceModal(false)
    if (type === 'overall') {
      navigate(`/analysis/${sessionId}`)
    } else {
      navigate(`/live/${sessionId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 slide-in">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 bg-clip-text text-transparent">
            Meeting Emotion Analysis
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Upload your meeting recording to get real-time emotional insights and comprehensive analysis
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
        <div className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              file
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'
            }`}
          >
            <ArrowUpTrayIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            
            <input
              type="file"
              id="file-upload"
              accept=".mp4,.mp3,.wav,.avi,.mov,.mkv"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            
            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              {file ? (
                <div>
                  <p className="text-lg font-semibold text-white mb-2">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setFile(null)
                    }}
                    className="mt-3 text-sm text-gray-400 hover:text-white"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-white mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-400">
                    MP4, MP3, WAV, AVI, MOV, MKV (Max 200MB)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full btn-primary ${
              (!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload & Analyze'}
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-semibold mb-2">Overall Analysis</h3>
          <p className="text-sm text-gray-400">
            Comprehensive emotion clustering, team dynamics, and AI-powered insights
          </p>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
          <div className="text-3xl mb-3">🔴</div>
          <h3 className="text-lg font-semibold mb-2">Real-time Dashboard</h3>
          <p className="text-sm text-gray-400">
            Live KPIs updating as you watch the meeting unfold
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>🔒 Privacy Protected: Only voice tone analyzed. No content recorded or stored.</p>
      </div>

      {/* Choice Modal */}
      {showChoiceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-center gradient-text">
              Choose Analysis Type
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Select how you'd like to analyze your meeting recording
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Overall Analysis */}
              <button
                onClick={() => handleAnalysisChoice('overall')}
                className="group bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-primary-500/20 hover:to-secondary-500/20 border-2 border-gray-600 hover:border-primary-500 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary-400 transition-colors">
                  Overall Analysis
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Complete comprehensive analysis with AI insights, emotion clustering, and team dynamics
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>✓ Full emotion timeline</li>
                  <li>✓ AI-powered recommendations</li>
                  <li>✓ Team clustering analysis</li>
                  <li>✓ Downloadable PDF report</li>
                </ul>
              </button>

              {/* Real-time Dashboard */}
              <button
                onClick={() => handleAnalysisChoice('live')}
                className="group bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-red-500/20 hover:to-orange-500/20 border-2 border-gray-600 hover:border-red-500 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">🔴</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">
                  Live Dashboard
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Real-time KPIs that update as you watch the meeting video playback
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>✓ Live emotion tracking</li>
                  <li>✓ Real-time energy gauges</li>
                  <li>✓ Interactive video player</li>
                  <li>✓ Instant metric updates</li>
                </ul>
              </button>
            </div>

            <button
              onClick={() => {
                setShowChoiceModal(false)
                setSessionId(null)
              }}
              className="mt-6 w-full text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
