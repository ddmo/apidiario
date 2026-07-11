interface WeatherIconProps {
  category: 'clear' | 'cloudy' | 'rain' | 'drizzle' | 'fog' | 'snow' | 'thunderstorm'
  color: string
  size?: number
}

export function WeatherIcon({ category, color, size = 20 }: WeatherIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {category === 'clear' && (
        <>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </>
      )}
      {category === 'cloudy' && (
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      )}
      {(category === 'rain' || category === 'drizzle') && (
        <>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <line x1="8" y1="19" x2="8" y2="21" /><line x1="8" y1="13" x2="8" y2="15" />
          <line x1="16" y1="19" x2="16" y2="21" /><line x1="16" y1="13" x2="16" y2="15" />
          <line x1="12" y1="21" x2="12" y2="23" /><line x1="12" y1="15" x2="12" y2="17" />
        </>
      )}
      {category === 'fog' && (
        <>
          <line x1="2" y1="12" x2="22" y2="12" /><line x1="5" y1="8" x2="19" y2="8" />
          <line x1="3" y1="16" x2="21" y2="16" /><line x1="8" y1="20" x2="16" y2="20" />
        </>
      )}
      {category === 'snow' && (
        <>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <path d="M12 10l-3 3h6l-3-3z" fill={color} opacity="0.3" />
        </>
      )}
      {category === 'thunderstorm' && (
        <>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          <line x1="8" y1="19" x2="8" y2="21" /><line x1="16" y1="19" x2="16" y2="21" />
        </>
      )}
    </svg>
  )
}
