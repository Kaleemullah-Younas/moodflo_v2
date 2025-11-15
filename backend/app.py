"""
Moodflo V2 - FastAPI Backend
Real-time emotion analysis for meeting recordings
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
from pathlib import Path
import tempfile
import os
import asyncio
import json
from typing import Dict, Optional
import uuid
from datetime import datetime

from services.analyzer_service import AnalyzerService
from services.realtime_service import RealtimeStreamingService
from models.schemas import AnalysisResponse, StreamConfig
from modules.report_generator import ReportGenerator
from config import settings

app = FastAPI(
    title="Moodflo API",
    description="Real-time emotion analysis for meetings",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service instances
analyzer_service = AnalyzerService()
streaming_service = RealtimeStreamingService()

# Active sessions storage
active_sessions: Dict[str, Dict] = {}


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Moodflo API v2.0",
        "endpoints": {
            "upload": "/api/upload",
            "analyze": "/api/analyze/{session_id}",
            "stream": "/ws/stream/{session_id}"
        }
    }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a meeting recording (video/audio)
    Returns a session_id for further analysis
    """
    # Validate file type
    allowed_extensions = ['.mp4', '.mp3', '.wav', '.avi', '.mov', '.mkv']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create session
    session_id = str(uuid.uuid4())
    
    # Save file temporarily
    temp_dir = Path(tempfile.gettempdir()) / "moodflo" / session_id
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = temp_dir / file.filename
    
    # Write file
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Store session info
    active_sessions[session_id] = {
        "file_path": str(file_path),
        "filename": file.filename,
        "status": "uploaded",
        "analysis_complete": False
    }
    
    return {
        "session_id": session_id,
        "filename": file.filename,
        "size": len(content),
        "message": "File uploaded successfully"
    }


@app.post("/api/analyze/{session_id}")
async def analyze_meeting(session_id: str, background_tasks: BackgroundTasks):
    """
    Start comprehensive analysis of uploaded meeting
    This runs the full analysis: clustering, AI insights, etc.
    Shares results with live streaming to avoid duplicate processing
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    # Check if analysis already exists (from live streaming or previous analysis)
    if session.get("analysis_complete") and session.get("analysis"):
        print(f"✅ Using cached analysis for session {session_id}")
        return {
            "session_id": session_id,
            "status": "complete",
            "results": session["analysis"]
        }
    
    # Check if stream_data exists from progressive streaming
    # If so, wait a bit for it to complete, then generate analysis from it
    if "stream_data" in session:
        stream_data = session["stream_data"]
        
        # Wait up to 30 seconds for streaming to complete (check every 2 seconds)
        for _ in range(15):
            if stream_data.get("is_fully_processed"):
                print(f"✅ Using completed stream_data for analysis (session {session_id})")
                break
            print(f"⏳ Waiting for progressive streaming to complete...")
            await asyncio.sleep(2)
        
        # If streaming completed, build analysis from stream_data (much faster!)
        if stream_data.get("is_fully_processed"):
            print(f"🚀 Building analysis from stream_data (no reprocessing needed)")
            results = await streaming_service.build_analysis_from_stream(stream_data, session["file_path"])
            session["analysis"] = results
            session["analysis_complete"] = True
            session["status"] = "complete"
            print(f"✅ Analysis built from stream_data for session {session_id}")
            
            return {
                "session_id": session_id,
                "status": "complete",
                "results": results
            }
    
    file_path = session["file_path"]
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Update status
    session["status"] = "analyzing"
    
    try:
        # Run full analysis from scratch
        print(f"🔄 Running full analysis from scratch for session {session_id}")
        results = await analyzer_service.analyze_full(file_path)
        
        # Store results for both overall and live dashboard
        session["analysis"] = results
        session["analysis_complete"] = True
        session["status"] = "complete"
        
        # Also create stream_data from analysis results for live dashboard
        if "stream_data" not in session:
            # Convert analysis timeline to stream_data format
            timeline = results["timeline"]
            
            # Extract timestamps, energy, emotions, and categories from timeline
            timestamps = [point['time'] for point in timeline]
            energy_timeline = [point['energy'] for point in timeline]
            emotion_series = [point['emotion_raw'] for point in timeline]
            categories = [point['category'] for point in timeline]
            
            stream_data = {
                "duration": results["duration"],
                "timestamps": timestamps,
                "energy_timeline": energy_timeline,
                "emotion_series": emotion_series,
                "categories": categories,
                "sample_rate": 16000,  # Default sample rate
                "is_fully_processed": True
            }
            session["stream_data"] = stream_data
            print(f"💾 Created complete stream_data from analysis for session {session_id}")
        
        return {
            "session_id": session_id,
            "status": "complete",
            "results": results
        }
    
    except Exception as e:
        session["status"] = "error"
        session["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/analysis/{session_id}")
async def get_analysis(session_id: str):
    """Get analysis results for a session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    if not session.get("analysis_complete"):
        return {
            "session_id": session_id,
            "status": session.get("status", "pending"),
            "message": "Analysis not complete"
        }
    
    return {
        "session_id": session_id,
        "status": "complete",
        "results": session.get("analysis")
    }


@app.websocket("/ws/stream/{session_id}")
async def websocket_stream(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time emotion streaming
    Client sends video playback time, server streams emotion data
    """
    await websocket.accept()
    
    if session_id not in active_sessions:
        await websocket.send_json({
            "type": "error",
            "message": "Session not found"
        })
        await websocket.close()
        return
    
    session = active_sessions[session_id]
    file_path = session["file_path"]
    
    try:
        # Initialize streaming for this session if not already done
        if "stream_data" not in session:
            print(f"🔄 Cache miss for session {session_id}, initializing stream...")
            await websocket.send_json({
                "type": "status",
                "message": "Initializing real-time analysis..."
            })
            
            # Pre-process file for streaming
            stream_data = await streaming_service.initialize_stream(file_path)
            session["stream_data"] = stream_data
            print(f"💾 Cached stream_data for session {session_id}")
            
            # Don't run duplicate full analysis - progressive streaming already processes everything
            # The full analysis will be generated on-demand when user navigates to Overall Analysis
            
            # Send ready message
            ready_msg = {
                "type": "ready",
                "duration": stream_data["duration"],
                "message": "Ready for streaming"
            }
            print(f"📡 Sending ready message: {ready_msg}")
            await websocket.send_json(ready_msg)
            
            # Give client time to process
            await asyncio.sleep(0.1)
        else:
            # Stream data already exists, send ready immediately
            print(f"✅ Cache hit for session {session_id}, using cached stream_data")
            stream_data = session["stream_data"]
            ready_msg = {
                "type": "ready",
                "duration": stream_data["duration"],
                "message": "Ready for streaming"
            }
            print(f"📡 Sending ready message (cached): {ready_msg}")
            await websocket.send_json(ready_msg)
            await asyncio.sleep(0.1)
        
        stream_data = session["stream_data"]
        
        # Listen for playback time updates
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_json()
                
                if data.get("type") == "seek":
                    current_time = data.get("time", 0)
                    
                    # Get emotion data for current time window
                    emotion_update = streaming_service.get_realtime_data(
                        stream_data,
                        current_time
                    )
                    
                    # Send update to client
                    await websocket.send_json({
                        "type": "update",
                        "time": current_time,
                        "data": emotion_update
                    })
                
                elif data.get("type") == "ping":
                    # Respond to keep-alive ping
                    await websocket.send_json({
                        "type": "pong"
                    })
            
            except WebSocketDisconnect:
                print("WebSocket disconnected by client")
                break
            except Exception as e:
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
                except:
                    pass
                break
    
    except WebSocketDisconnect:
        print("WebSocket disconnected during initialization")
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Streaming error: {str(e)}"
            })
        except:
            pass


@app.get("/api/video/{session_id}")
async def get_video(session_id: str):
    """Stream video file for playback"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    file_path = session["file_path"]
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        file_path,
        media_type="video/mp4",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache"
        }
    )


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Clean up session and temporary files"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    # Delete temporary files
    file_path = Path(session["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Remove directory
    temp_dir = file_path.parent
    if temp_dir.exists():
        temp_dir.rmdir()
    
    # Remove from active sessions
    del active_sessions[session_id]
    
    return {"message": "Session deleted successfully"}


@app.get("/api/export/{session_id}/pdf")
async def export_pdf(session_id: str):
    """Export analysis as PDF file"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    if not session.get("analysis_complete"):
        raise HTTPException(status_code=400, detail="Analysis not complete")
    
    # Generate PDF report
    generator = ReportGenerator(session["analysis"], session_id)
    pdf_buffer = generator.generate_pdf_report()
    
    # Save to temp file
    temp_file = Path(tempfile.gettempdir()) / f"moodflo_report_{session_id[:8]}.pdf"
    with open(temp_file, 'wb') as f:
        f.write(pdf_buffer.read())
    
    return FileResponse(
        temp_file,
        media_type='application/pdf',
        filename=f'moodflo_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    )


@app.get("/api/export/{session_id}/json")
async def export_json(session_id: str):
    """Export analysis as JSON file"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    if not session.get("analysis_complete"):
        raise HTTPException(status_code=400, detail="Analysis not complete")
    
    # Generate JSON report
    generator = ReportGenerator(session["analysis"], session_id)
    json_data = generator.generate_json_report()
    
    return JSONResponse(
        content=json_data,
        headers={
            'Content-Disposition': f'attachment; filename=moodflo_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        }
    )


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "active_sessions": len(active_sessions),
        "vokaturi_available": analyzer_service.emotion_detector.vokaturi_loaded
    }


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
