"""
Report Generation Module
Generate PDF reports from analysis results using ReportLab
"""
from datetime import datetime
from typing import Dict, List
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER


class ReportGenerator:
    """Generate downloadable PDF reports from analysis results"""
    
    def __init__(self, results: Dict, session_id: str):
        self.results = results
        self.session_id = session_id
        self.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def format_time(self, seconds: float) -> str:
        """Format seconds to MM:SS"""
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}:{secs:02d}"
    
    def strip_emoji(self, text: str) -> str:
        """Remove emoji characters from text for PDF compatibility"""
        import re
        # Remove emojis and extra spaces
        emoji_pattern = re.compile("["
                                  u"\U0001F600-\U0001F64F"  # emoticons
                                  u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                                  u"\U0001F680-\U0001F6FF"  # transport & map symbols
                                  u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                                  u"\U00002702-\U000027B0"
                                  u"\U000024C2-\U0001F251"
                                  "]+", flags=re.UNICODE)
        return emoji_pattern.sub('', text).strip()
    
    def generate_pdf_report(self) -> io.BytesIO:
        """Generate a professional PDF report"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch,
            leftMargin=0.75*inch,
            rightMargin=0.75*inch
        )
        story = []
        
        summary = self.results['summary']
        timeline = self.results['timeline']
        duration = self.results['duration']
        suggestions = self.results.get('suggestions', 'No insights available.')
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#667eea'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#667eea'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        normal_style = styles['Normal']
        normal_style.fontSize = 10
        normal_style.leading = 14
        
        # Title
        story.append(Paragraph("MOODFLO", title_style))
        story.append(Paragraph("Meeting Emotion Analysis Report", styles['Heading2']))
        story.append(Spacer(1, 0.3*inch))
        
        # Report Info
        info_data = [
            ["Generated:", self.timestamp],
            ["Session ID:", self.session_id[:13] + "..."],
            ["Duration:", self.format_time(duration)],
        ]
        
        info_table = Table(info_data, colWidths=[1.5*inch, 4.5*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#667eea')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", heading_style))
        
        summary_data = [
            ["Metric", "Value"],
            ["Dominant Emotion", summary['dominant_emotion']],
            ["Average Energy Level", f"{summary['avg_energy']:.1f}"],
            ["Silence Percentage", f"{summary['silence_pct']:.1f}%"],
            ["Participation Rate", f"{summary['participation']:.1f}%"],
            ["Emotional Volatility", f"{summary['volatility']:.2f}"],
            ["Psychological Safety", summary['psych_risk']],
        ]
        
        summary_table = Table(summary_data, colWidths=[2.5*inch, 3.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.2*inch))
        
        # AI-Powered Insights
        story.append(Paragraph("AI-Powered Insights and Recommendations", heading_style))
        
        for line in suggestions.split('\n'):
            if line.strip():
                story.append(Paragraph(line, normal_style))
                story.append(Spacer(1, 0.05*inch))
        
        story.append(Spacer(1, 0.2*inch))
        story.append(PageBreak())
        
        # Emotion Distribution
        story.append(Paragraph("Emotion Distribution", heading_style))
        
        emotion_data = [["Emotion", "Percentage"]]
        for emotion, percentage in summary['distribution'].items():
            emotion_data.append([emotion, f"{percentage:.1f}%"])
        
        emotion_table = Table(emotion_data, colWidths=[3.5*inch, 2*inch])
        emotion_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        story.append(emotion_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Timeline Summary (every 30 seconds)
        story.append(Paragraph("Emotion Timeline - 30-second intervals", heading_style))
        
        timeline_data = [["Time", "Emotion", "Energy"]]
        for t_idx in range(0, len(timeline), max(1, int(30 / 5))):
            point = timeline[t_idx]
            time_str = self.format_time(point['time'])
            emotion = self.strip_emoji(point['category'])  # Remove emoji for PDF
            energy = f"{point['energy']:.1f}"
            timeline_data.append([time_str, emotion, energy])
        
        timeline_table = Table(timeline_data, colWidths=[1*inch, 3.5*inch, 1*inch])
        timeline_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        story.append(timeline_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(
            "This report is confidential and intended for internal use only.",
            footer_style
        ))
        story.append(Paragraph(
            "Data processed locally - no information sent to external servers.",
            footer_style
        ))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_json_report(self) -> Dict:
        """Generate JSON export of all analysis data"""
        return {
            "metadata": {
                "session_id": self.session_id,
                "generated": self.timestamp,
                "duration": self.results['duration']
            },
            "summary": self.results['summary'],
            "timeline": self.results['timeline'],
            "clusters": self.results.get('clusters', {}),
            "suggestions": self.results.get('suggestions', ''),
            "version": "2.0.0"
        }

