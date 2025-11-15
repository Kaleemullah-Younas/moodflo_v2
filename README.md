# Moodflo V2 - Real-time Meeting Emotion Analysis

A modern, real-time emotion analysis system for meeting recordings using FastAPI + WebSockets + React.

## 🎯 Overview

Moodflo analyzes the emotional tone of meeting recordings using advanced voice emotion detection. It provides:
- **Real-time emotion streaming** during video playback
- **Comprehensive analytics** with AI-powered insights
- **Team clustering** to understand group dynamics
- **Psychological safety assessment** for better team health

## ✨ Key Features

### Live Dashboard
- Real-time emotion tracking as video plays
- Live KPI updates (Current Emotion, Energy, Emotion Shifts, Elapsed Time)
- Dynamic charts updating in sync with video
- Distribution analysis & energy gauge
- Running average & volatility indicators

### Overall Analysis
- Comprehensive emotion breakdown over entire meeting
- Team clustering analysis (K-means)
- AI-powered insights using OpenAI GPT-4
- Psychological safety risk assessment
- Detailed metrics: energy, participation, volatility
- Downloadable PDF reports

## 🏗️ Architecture

```
moodflo-v2/
├── backend/                    # FastAPI Backend
│   ├── app.py                 # Main API + WebSocket server
│   ├── config.py              # Centralized configuration
│   ├── core/                  # Core analysis modules
│   │   ├── audio_processor.py      # FFmpeg audio extraction
│   │   ├── emotion_detector.py     # Vokaturi emotion detection
│   │   ├── mood_mapper.py          # Emotion categorization
│   │   ├── metrics_processor.py    # Meeting metrics
│   │   ├── cluster_analyzer.py     # K-means clustering
│   │   ├── risk_assessor.py        # Safety assessment
│   │   └── insights_generator.py   # GPT-4 insights
│   ├── services/              # Business logic
│   │   ├── analyzer_service.py     # Overall analysis
│   │   └── realtime_service.py     # Real-time streaming
│   ├── models/schemas.py      # Pydantic data models
│   └── modules/report_generator.py # PDF reports
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Upload.jsx           # File upload interface
│   │   │   ├── Analysis.jsx         # Overall analysis view
│   │   │   └── LiveDashboard.jsx    # Real-time dashboard
│   │   ├── components/
│   │   │   ├── Header.jsx           # Navigation header
│   │   │   └── MetricCard.jsx       # Reusable KPI card
│   │   ├── services/api.js          # API & WebSocket client
│   │   └── utils/helpers.js         # Utility functions
│   └── package.json
│
└── OpenVokaturi-4-0/          # Emotion detection SDK
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.11**
- **Node.js 18+**
- **FFmpeg** (for audio extraction)
- **OpenAI API Key** (optional, for AI insights)

### Installation

#### 1. Backend Setup
```bash
cd moodflo-v2/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
.env

# Edit .env and add your OpenAI API key (optional)
```

**Backend Environment Variables (.env):**
```env
OPENAI_API_KEY=sk-your-key-here    # Optional for AI insights
HOST=0.0.0.0
PORT=8000
DEBUG=True
AUDIO_SAMPLE_RATE=16000
PARALLEL_WORKERS=4                  # Adjust based on CPU cores
STREAM_UPDATE_INTERVAL=5.0
```

#### 2. Frontend Setup
```bash
cd moodflo-v2/frontend

# Install dependencies
npm install

# Create environment file
.env
```

**Frontend Environment Variables (.env):**
```env
VITE_API_URL=http://localhost:8000
```

#### 3. Install FFmpeg
```bash
# Windows (using winget)
winget install FFmpeg

# Mac (using Homebrew)
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

### Running the Application

#### Option 1: Separate Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd moodflo-v2/backend
.\venv\Scripts\Activate.ps1    # Windows
# source venv/bin/activate     # Mac/Linux
python app.py
```
Backend runs at: `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd moodflo-v2/frontend
npm run dev
```
Frontend runs at: `http://localhost:5173`

#### Option 2: Production Build

**Backend:**
```bash
cd backend
pip install gunicorn
gunicorn app:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 300
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

## 📖 Usage Guide

### 1. Upload Meeting Recording
- Navigate to `http://localhost:5173`
- Drag and drop a video/audio file (MP4, MP3, WAV, AVI, MOV, MKV)
- Wait for upload to complete

### 2. Choose Analysis Type

**Option A: Live Dashboard (Recommended First)**
- Click "View Live Dashboard"
- Video loads in ~5-10 seconds with progressive processing
- Play video to see real-time emotion updates
- KPIs update as video plays
- Charts display live emotion data

**Option B: Overall Analysis**
- Click "View Overall Analysis"  
- Complete analysis runs (~40-50 seconds for typical meeting)
- View comprehensive metrics and insights
- Download PDF report

### 3. Switch Between Views
- Both analyses share cached data
- Switching is instant (no reprocessing needed)
- Progressive streaming enables fast initial load
- Background processing completes full analysis

## 🎭 Emotion Categories

| Icon | Category | Description |
|------|----------|-------------|
| ⚡ | Energised | Positive, high energy, upbeat tone |
| 🔥 | Stressed/Tense | High stress, tension in voice |
| 🌫 | Flat/Disengaged | Low energy, minimal engagement |
| 💬 | Thoughtful/Constructive | Calm, focused, productive discussion |
| 🌪 | Volatile/Unstable | Unpredictable, mixed emotional patterns |

## 📊 API Endpoints

### REST API
- `POST /api/upload` - Upload meeting recording
- `POST /api/analyze/{session_id}` - Start comprehensive analysis
- `GET /api/analysis/{session_id}` - Get analysis results
- `GET /api/video/{session_id}` - Stream video file
- `DELETE /api/session/{session_id}` - Clean up session (optional)

### WebSocket
- `WS /ws/stream/{session_id}` - Real-time emotion streaming
  - Client sends: `{"type": "seek", "time": 12.5}`
  - Server sends: `{"type": "update", "time": 12.5, "data": {...}}`

### API Documentation
- Interactive docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔧 Configuration

### Performance Tuning

**Parallel Workers** (`backend/config.py`):
```python
PARALLEL_WORKERS: int = 4  # Set to your CPU core count
```


## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance web framework
- **WebSockets** - Real-time bidirectional communication
- **Vokaturi SDK** - Voice emotion detection
- **scikit-learn** - Machine learning (K-means clustering)
- **OpenAI GPT-4** - AI-powered insights generation
- **librosa** - Audio processing and feature extraction
- **ReportLab** - PDF report generation
- **NumPy/Pandas** - Data processing

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Next-generation build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful data visualizations
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Hot Toast** - Notifications

## 🔐 Privacy & Security

- ✅ **No content storage** - Only acoustic features analyzed
- ✅ **No transcription** - Speech content never recorded
- ✅ **Temporary files** - Automatically cleaned after processing
- ✅ **Local processing** - All analysis runs on your server
- ✅ **No external data sharing** - Data stays within your infrastructure

## 🐛 Troubleshooting

### Backend Issues

**"Vokaturi not found"**
- Ensure `OpenVokaturi-4-0` folder is in project root
- Check correct library exists for your platform:
  - Windows: `OpenVokaturi-4-0-win64.dll`
  - Mac: `OpenVokaturi-4-0-mac.dylib`
  - Linux: `OpenVokaturi-4-0-linux.so`

**"FFmpeg not found"**
- Install FFmpeg and add to system PATH
- Restart terminal after installation
- Test: `ffmpeg -version`

**"Port 8000 already in use"**
- Change `PORT` in `backend/.env`
- Or kill existing process: `lsof -ti:8000 | xargs kill` (Mac/Linux)

**"Module not found" errors**
- Activate virtual environment: `.\venv\Scripts\Activate.ps1`
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Issues

**"Failed to connect to real-time stream"**
- Ensure backend is running first
- Check CORS settings in `backend/config.py`
- Verify WebSocket URL in `frontend/.env`

**Build errors**
- Delete `node_modules` and reinstall: `npm install`
- Clear cache: `npm cache clean --force`

**Charts not displaying**
- Check browser console for errors
- Ensure Recharts is installed: `npm install recharts`


## 🚢 Deployment

### Production Considerations

1. **Environment Variables**
   - Set `DEBUG=False` in production
   - Use strong API keys
   - Configure proper CORS origins

2. **Server Configuration**
   - Use Gunicorn with Uvicorn workers
   - Set appropriate worker count (2-4 × CPU cores)
   - Configure timeout for long-running analyses

3. **Frontend Build**
   - Run `npm run build`
   - Serve `dist/` folder with Nginx or similar
   - Configure proper API URL

4. **Monitoring**
   - Set up error logging
   - Monitor server resources (CPU, memory)
   - Track WebSocket connection health
