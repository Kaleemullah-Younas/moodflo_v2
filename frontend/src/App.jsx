import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Upload from './pages/Upload'
import Analysis from './pages/Analysis'
import LiveDashboard from './pages/LiveDashboard'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <Routes>
        <Route
          path="/"
          element={
            <Upload
              onUploadComplete={(id) => setSessionId(id)}
            />
          }
        />
        
        <Route
          path="/analysis/:sessionId"
          element={
            <Analysis
              sessionId={sessionId}
              onAnalysisComplete={(data) => setAnalysisData(data)}
            />
          }
        />
        
        <Route
          path="/live/:sessionId"
          element={
            <LiveDashboard
              sessionId={sessionId}
            />
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
