"""
Configuration settings for Moodflo backend
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Audio Processing
    AUDIO_SAMPLE_RATE: int = 16000
    FRAME_DURATION: float = 5.0  # seconds
    HOP_DURATION: float = 2.5  # seconds
    SILENCE_THRESHOLD: float = 0.01  # Lower threshold for better speech detection
    ENERGY_SCALE: int = 100
    
    # Real-time Streaming
    STREAM_UPDATE_INTERVAL: float = 5.0  # Update every 5 seconds
    STREAM_BUFFER_SIZE: int = 10  # Number of frames to buffer
    
    # Parallel Processing
    PARALLEL_WORKERS: int = 4  # Conservative for real-time
    BATCH_SIZE: int = 20
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4"
    
    # Vokaturi
    VOKATURI_PATH: Path = Path(__file__).parent.parent / "OpenVokaturi-4-0" / "OpenVokaturi-4-0"
    
    # Emotion Categories
    MOODFLO_CATEGORIES: dict = {
        "energised": "⚡ Energised",
        "stressed": "🔥 Stressed/Tense",
        "flat": "🌫 Flat/Disengaged",
        "thoughtful": "💬 Thoughtful/Constructive",
        "volatile": "🌪 Volatile/Unstable"
    }
    
    # Psychological Safety Thresholds
    PSYCH_SAFETY_THRESHOLDS: dict = {
        "high_risk": {"silence": 25, "stress": 40, "volatility": 7.5},
        "medium_risk": {"silence": 15, "stress": 30, "volatility": 5.5}
    }
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
