export default function MetricCard({ title, value, subtitle, color, icon }) {
  return (
    <div className="metric-card group relative overflow-hidden">
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-secondary-500/0 group-hover:from-primary-500/10 group-hover:to-secondary-500/10 transition-all duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">
            {title}
          </div>
          {icon && (
            <div className="text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              {icon}
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <div 
            className={`text-4xl font-bold group-hover:scale-105 transition-transform duration-300 ${color || 'text-white'}`}
            style={!color ? { color: '#f3f4f6' } : {}}
          >
            {value}
          </div>
        </div>
        
        {subtitle && (
          <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300 font-medium">
            {subtitle}
          </div>
        )}
      </div>
      
      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    </div>
  )
}
