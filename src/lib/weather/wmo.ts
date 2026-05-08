export interface WeatherDescriptor {
  code: number
  label_it: string
  icon: string
  color: string
  category: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm'
}

const WMO_MAP: Record<number, WeatherDescriptor> = {
  0:  { code: 0,  label_it: 'Sereno',                icon: 'ti-sun',         color: '#EF9F27', category: 'clear' },
  1:  { code: 1,  label_it: 'Prevalentemente sereno',icon: 'ti-sun',         color: '#EF9F27', category: 'clear' },
  2:  { code: 2,  label_it: 'Parzialmente nuvoloso', icon: 'ti-cloud',       color: '#888780', category: 'cloudy' },
  3:  { code: 3,  label_it: 'Coperto',               icon: 'ti-cloud',       color: '#5F5E5A', category: 'cloudy' },

  45: { code: 45, label_it: 'Nebbia',                icon: 'ti-cloud-fog',   color: '#888780', category: 'fog' },
  48: { code: 48, label_it: 'Nebbia con brina',      icon: 'ti-cloud-fog',   color: '#888780', category: 'fog' },

  51: { code: 51, label_it: 'Pioviggine leggera',    icon: 'ti-cloud-rain',  color: '#85B7EB', category: 'drizzle' },
  53: { code: 53, label_it: 'Pioviggine moderata',   icon: 'ti-cloud-rain',  color: '#378ADD', category: 'drizzle' },
  55: { code: 55, label_it: 'Pioviggine intensa',    icon: 'ti-cloud-rain',  color: '#185FA5', category: 'drizzle' },
  56: { code: 56, label_it: 'Pioviggine gelata',     icon: 'ti-cloud-rain',  color: '#85B7EB', category: 'drizzle' },
  57: { code: 57, label_it: 'Pioviggine gelata int.',icon: 'ti-cloud-rain',  color: '#378ADD', category: 'drizzle' },

  61: { code: 61, label_it: 'Pioggia leggera',       icon: 'ti-cloud-rain',  color: '#85B7EB', category: 'rain' },
  63: { code: 63, label_it: 'Pioggia moderata',      icon: 'ti-cloud-rain',  color: '#378ADD', category: 'rain' },
  65: { code: 65, label_it: 'Pioggia forte',         icon: 'ti-cloud-rain',  color: '#185FA5', category: 'rain' },
  66: { code: 66, label_it: 'Pioggia gelata',        icon: 'ti-cloud-rain',  color: '#85B7EB', category: 'rain' },
  67: { code: 67, label_it: 'Pioggia gelata forte',  icon: 'ti-cloud-rain',  color: '#378ADD', category: 'rain' },

  71: { code: 71, label_it: 'Neve leggera',          icon: 'ti-snowflake',   color: '#B5D4F4', category: 'snow' },
  73: { code: 73, label_it: 'Neve moderata',         icon: 'ti-snowflake',   color: '#85B7EB', category: 'snow' },
  75: { code: 75, label_it: 'Neve forte',            icon: 'ti-snowflake',   color: '#378ADD', category: 'snow' },
  77: { code: 77, label_it: 'Granelli di neve',      icon: 'ti-snowflake',   color: '#85B7EB', category: 'snow' },

  80: { code: 80, label_it: 'Rovesci leggeri',       icon: 'ti-cloud-rain',  color: '#85B7EB', category: 'rain' },
  81: { code: 81, label_it: 'Rovesci moderati',      icon: 'ti-cloud-rain',  color: '#378ADD', category: 'rain' },
  82: { code: 82, label_it: 'Rovesci violenti',      icon: 'ti-cloud-rain',  color: '#185FA5', category: 'rain' },
  85: { code: 85, label_it: 'Rovesci di neve',       icon: 'ti-snowflake',   color: '#85B7EB', category: 'snow' },
  86: { code: 86, label_it: 'Rovesci di neve forti', icon: 'ti-snowflake',   color: '#378ADD', category: 'snow' },

  95: { code: 95, label_it: 'Temporale',             icon: 'ti-cloud-storm', color: '#BA7517', category: 'thunderstorm' },
  96: { code: 96, label_it: 'Temporale con grandine',icon: 'ti-cloud-storm', color: '#A32D2D', category: 'thunderstorm' },
  99: { code: 99, label_it: 'Temporale violento',    icon: 'ti-cloud-storm', color: '#A32D2D', category: 'thunderstorm' },
}

export function describeWeather(code: number): WeatherDescriptor {
  return WMO_MAP[code] ?? {
    code,
    label_it: 'Non disponibile',
    icon: 'ti-help',
    color: '#888780',
    category: 'cloudy',
  }
}
