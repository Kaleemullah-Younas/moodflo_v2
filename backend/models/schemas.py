"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class StreamConfig(BaseModel):
    """Configuration for real-time streaming"""
    update_interval: float = Field(default=5.0, description="Update interval in seconds")
    buffer_size: int = Field(default=10, description="Number of frames to buffer")


class EmotionData(BaseModel):
    """Single emotion detection result"""
    neutral: float
    happy: float
    sad: float
    angry: float
    fearful: float


class RealtimeUpdate(BaseModel):
    """Real-time emotion update for streaming"""
    time: float
    current_emotion: str
    current_energy: float
    avg_energy: float
    silence_percentage: float
    emotion_shifts: int
    emotion_distribution: Dict[str, float]


class TimelinePoint(BaseModel):
    """Single point in emotion timeline"""
    time: float
    energy: float
    category: str
    emotion_raw: EmotionData


class ClusterData(BaseModel):
    """Clustering analysis results"""
    n_clusters: int
    labels: List[int]
    coordinates: List[List[float]]
    description: str


class MetricsSummary(BaseModel):
    """Summary metrics for entire meeting"""
    dominant_emotion: str
    avg_energy: float
    silence_pct: float
    participation: float
    volatility: float
    psych_risk: str
    distribution: Dict[str, float]


class AnalysisResponse(BaseModel):
    """Complete analysis response"""
    session_id: str
    duration: float
    summary: MetricsSummary
    timeline: List[TimelinePoint]
    clusters: ClusterData
    suggestions: str
    timestamp: datetime = Field(default_factory=datetime.now)


class UploadResponse(BaseModel):
    """File upload response"""
    session_id: str
    filename: str
    size: int
    message: str


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
