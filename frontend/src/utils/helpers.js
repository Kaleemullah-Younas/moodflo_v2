export const emotionConfig = {
  '⚡ Energised': {
    color: '#00d4aa',
    emoji: '⚡',
    description: 'High energy, positive tone',
  },
  '🔥 Stressed/Tense': {
    color: '#ff4444',
    emoji: '🔥',
    description: 'High stress, tension detected',
  },
  '🌫 Flat/Disengaged': {
    color: '#888888',
    emoji: '🌫',
    description: 'Low energy, disengagement',
  },
  '💬 Thoughtful/Constructive': {
    color: '#667eea',
    emoji: '💬',
    description: 'Calm, focused discussion',
  },
  '🌪 Volatile/Unstable': {
    color: '#ffa500',
    emoji: '🌪',
    description: 'Unpredictable emotional patterns',
  },
}

export const getEmotionColor = (emotion) => {
  for (const [key, config] of Object.entries(emotionConfig)) {
    if (emotion?.includes(key.split(' ')[1])) {
      return config.color
    }
  }
  return '#667eea'
}

export const getRiskColor = (risk) => {
  const colors = {
    Low: '#00d4aa',
    Medium: '#ffa500',
    High: '#ff4444',
  }
  return colors[risk] || '#667eea'
}

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}
