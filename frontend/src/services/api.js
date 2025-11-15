/**
 * API Service
 * Handles all backend communication
 */
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiService = {
  /**
   * Upload a meeting recording file
   */
  uploadFile: async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress?.(percentCompleted)
      },
    })

    return response.data
  },

  /**
   * Start comprehensive analysis
   */
  startAnalysis: async (sessionId) => {
    const response = await api.post(`/api/analyze/${sessionId}`)
    return response.data
  },

  /**
   * Get analysis results
   */
  getAnalysis: async (sessionId) => {
    const response = await api.get(`/api/analysis/${sessionId}`)
    return response.data
  },

  /**
   * Delete session
   */
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/api/session/${sessionId}`)
    return response.data
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    const response = await api.get('/api/health')
    return response.data
  },

  /**
   * Export analysis as PDF
   */
  exportPdf: async (sessionId) => {
    const response = await api.get(`/api/export/${sessionId}/pdf`, {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Export analysis as JSON
   */
  exportJson: async (sessionId) => {
    const response = await api.get(`/api/export/${sessionId}/json`)
    return response.data
  },
}

/**
 * WebSocket Service for real-time streaming
 */
export class WebSocketService {
  constructor(sessionId) {
    this.sessionId = sessionId
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.listeners = new Map()
    this.isConnecting = false
    this.keepAliveInterval = null
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('⚠️ WebSocket already connecting or connected')
      return Promise.resolve()
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:8000/ws/stream/${this.sessionId}`
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      
      try {
        this.ws = new WebSocket(wsUrl)
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error)
        this.isConnecting = false
        reject(error)
        return
      }

      this.ws.onopen = () => {
        console.log('✓ WebSocket connected, waiting for stream initialization...')
        this.reconnectAttempts = 0
        this.isConnecting = false
        
        // Start keep-alive ping
        this.startKeepAlive()
        
        resolve()
      }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📩 WebSocket message received:', data)
        this.emit(data.type, data)
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnecting = false
      reject(error)
    }

      this.ws.onclose = () => {
        console.log('WebSocket closed')
        this.isConnecting = false
        this.stopKeepAlive()
        this.attemptReconnect()
      }
    })
  }

  startKeepAlive() {
    // Send periodic seek messages to keep connection alive
    this.keepAliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send a ping message
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Every 30 seconds
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.maxReconnectAttempts > 0) {
      this.reconnectAttempts++
      console.log(`Reconnect attempt ${this.reconnectAttempts}...`)
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts)
    } else if (this.maxReconnectAttempts === 0) {
      console.log('🛑 Connection closed, not reconnecting')
    }
  }

  /**
   * Send seek time to server
   */
  seek(time) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'seek',
        time: time,
      }))
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data))
    }
  }

  /**
   * Close connection
   */
  close() {
    this.stopKeepAlive()
    this.maxReconnectAttempts = 0 // Prevent reconnection
    if (this.ws) {
      console.log('🔌 Closing WebSocket connection')
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }
}

export default api
