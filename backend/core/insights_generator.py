"""
AI Insights Generator Module  
Generates actionable suggestions using OpenAI GPT-4
"""
from openai import OpenAI
from typing import Dict
from config import settings


class InsightsGenerator:
    """Generate AI-powered meeting insights"""
    
    def __init__(self, api_key: str = None):
        """Initialize with optional API key"""
        self.api_key = api_key or settings.OPENAI_API_KEY
        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                print(f"Warning: Could not initialize OpenAI client: {e}")
                self.client = None
        else:
            self.client = None
    
    def generate_suggestions(self, analysis_data: Dict) -> str:
        """
        Generate actionable suggestions based on analysis
        Falls back to rule-based if API key not available
        """
        if not self.client or not self.api_key:
            return self._fallback_suggestions(analysis_data)
        
        try:
            prompt = self._build_prompt(analysis_data)
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert meeting coach analyzing emotional patterns from acoustic analysis only (no content). Provide 4-5 concise, actionable suggestions focused on psychological safety and practical next steps."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=400
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            print(f"OpenAI error: {e}, using fallback")
            return self._fallback_suggestions(analysis_data)
    
    def _build_prompt(self, data: Dict) -> str:
        """Build prompt for GPT-4"""
        prompt = f"""Meeting Acoustic Analysis Summary:

Dominant Emotion: {data['dominant_emotion']}
Average Energy Level: {data['avg_energy']:.1f}/100
Silence Percentage: {data['silence_pct']:.1f}%
Participation Rate: {data['participation']:.1f}%
Volatility Score: {data['volatility']:.1f}/10
Psychological Safety Risk: {data['psych_risk']}

Emotion Distribution:
"""
        for emotion, percentage in data['distribution'].items():
            prompt += f"- {emotion}: {percentage:.1f}%\n"
        
        prompt += "\nGenerate 4-5 specific, actionable suggestions for the meeting leader based on these acoustic patterns."
        return prompt
    
    def _fallback_suggestions(self, data: Dict) -> str:
        """
        Rule-based suggestions when OpenAI unavailable
        Based on dominant emotion and risk level
        """
        suggestions = []
        dominant = data['dominant_emotion']
        
        # Category-specific suggestions
        if "Energised" in dominant:
            category_header = "⚡ ENERGISED MEETING\nTeam showed high energy and positive engagement.\n"
            suggestions.extend([
                "✓ Momentum is strong — protect it by ending meetings early this week",
                "✓ Share quick wins publicly to reward the positive energy",
                "✓ Add buffer time between meetings to prevent burnout",
                "✓ Capture key insights while engagement is at peak",
                "✓ Consider replicating this meeting format in future"
            ])
        
        elif "Stressed" in dominant or "Tense" in dominant:
            category_header = "🔥 STRESSED / TENSE MEETING\nTeam tone indicated stress and tension.\n"
            suggestions.extend([
                "⚠️ Cancel or postpone non-essential meetings this week",
                "⚠️ Offer one-to-one check-ins to understand concerns",
                "⚠️ Share something positive that's under control",
                "⚠️ Consider postponing major decisions until tension eases",
                "⚠️ Review workload distribution across the team"
            ])
        
        elif "Flat" in dominant or "Disengaged" in dominant:
            category_header = "🌫️ FLAT / DISENGAGED MEETING\nTeam showed low energy and engagement.\n"
            suggestions.extend([
                "⚡ Cut meeting time by 50% next week to respect energy levels",
                "⚡ Consider ending the week early for recovery",
                "⚡ Create space for anonymous feedback",
                "⚡ Introduce interactive elements or breakout discussions",
                "⚡ Review if meeting objectives are clear and relevant"
            ])
        
        elif "Thoughtful" in dominant or "Constructive" in dominant:
            category_header = "💬 THOUGHTFUL / FOCUSED MEETING\nTeam was calm, steady, and reflective.\n"
            suggestions.extend([
                "✓ Excellent meeting dynamics — maintain this format",
                "✓ Capture insights and decisions while they're fresh",
                "✓ Ask team: 'What helped today's flow?'",
                "✓ Document and repeat successful elements",
                "✓ Consider this a baseline for future meetings"
            ])
        
        elif "Volatile" in dominant or "Unstable" in dominant:
            category_header = "🌪️ VOLATILE / UNSTABLE MEETING\nEmotional tone was unpredictable and mixed.\n"
            suggestions.extend([
                "⚠️ Follow up individually with less active participants",
                "⚠️ Reiterate shared goals and objectives in writing",
                "⚠️ Consider bringing in facilitation support",
                "⚠️ Break large group into smaller discussion groups",
                "⚠️ Review meeting structure and participation balance"
            ])
        
        else:
            category_header = "MEETING ANALYSIS\n"
            suggestions.extend([
                "Review meeting structure and participation patterns",
                "Consider individual check-ins with team members",
                "Monitor emotional patterns in upcoming meetings",
                "Gather feedback on meeting effectiveness"
            ])
        
        # Add psychological safety context
        risk_level = data['psych_risk']
        
        if risk_level == "High":
            psych_section = f"""

🧠 PSYCHOLOGICAL SAFETY RISK: HIGH
Critical factors detected — immediate action required.

Metrics:
• Silence: {data['silence_pct']:.1f}%
• Stress: {data['distribution'].get('🔥 Stressed/Tense', 0):.1f}%
• Volatility: {data['volatility']:.1f}

URGENT ACTIONS:
• Pause all group decision-making immediately
• Score team's current working experience (1-5 scale)
• Run psychological safety retrospective
• Schedule one-to-one's with all participants
• Address concerns before proceeding with regular schedule
"""
            return category_header + "\nRECOMMENDATIONS:\n" + "\n".join(suggestions[:5]) + psych_section
        
        elif risk_level == "Medium":
            psych_note = f"""

⚠️ PSYCHOLOGICAL SAFETY RISK: MEDIUM
Some warning signs detected — monitor closely.

Metrics:
• Silence: {data['silence_pct']:.1f}%
• Stress: {data['distribution'].get('🔥 Stressed/Tense', 0):.1f}%
• Volatility: {data['volatility']:.1f}

NEXT STEPS:
• Monitor team dynamics in next session
• Create anonymous feedback channel
• Check in with quieter team members
"""
            return category_header + "\nRECOMMENDATIONS:\n" + "\n".join(suggestions[:5]) + psych_note
        
        else:
            return category_header + "\nRECOMMENDATIONS:\n" + "\n".join(suggestions[:5]) + "\n\n✓ Psychological Safety: LOW RISK — Team dynamics appear healthy"
