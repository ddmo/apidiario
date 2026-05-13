import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet'
import { X, LocateFixed, Maximize2, Satellite, Map as MapIcon } from 'lucide-react'
import L from 'leaflet'
import { Button } from '@/components/ui/button'
import 'leaflet/dist/leaflet.css'

interface MapPickerSheetProps {
  open: boolean
  onClose: () => void
  onConfirm: (lat: number, lng: number) => void
  initialLat?: number | null
  initialLng?: number | null
}

const FORAGING_RADIUS = 3000
const ITALY_CENTER = { lat: 42.5, lng: 12.5 }

const crosshairSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="10" stroke="white" stroke-width="3" fill="none" opacity="0.8"/>
  <circle cx="16" cy="16" r="10" stroke="#C7891A" stroke-width="1.75" fill="none"/>
  <line x1="16" y1="2" x2="16" y2="10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="16" y1="22" x2="16" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="2" y1="16" x2="10" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="22" y1="16" x2="30" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="16" y1="2" x2="16" y2="10" stroke="#C7891A" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="22" x2="16" y2="30" stroke="#C7891A" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="2" y1="16" x2="10" y2="16" stroke="#C7891A" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="22" y1="16" x2="30" y2="16" stroke="#C7891A" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2" fill="#C7891A" stroke="white" stroke-width="1.5"/>
</svg>`

const crosshairIcon = L.divIcon({
  html: crosshairSvg,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function CenterTracker({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const marker = L.marker(map.getCenter(), { icon: crosshairIcon, interactive: false, zIndexOffset: 1000 }).addTo(map)
    markerRef.current = marker

    const handler = () => {
      const c = map.getCenter()
      marker.setLatLng(c)
      onChange(c.lat, c.lng)
    }
    map.on('moveend', handler)
    handler()

    return () => {
      map.off('moveend', handler)
      marker.remove()
    }
  }, [map, onChange])

  return null
}

function FlyController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap()
  const prevRef = useRef<string | null>(null)

  useEffect(() => {
    if (!target) return
    const key = `${target.lat},${target.lng}`
    if (key === prevRef.current) return
    prevRef.current = key
    map.flyTo([target.lat, target.lng], 16, { duration: 0.8 })
  }, [map, target])

  return null
}

function ZoomToFit({ trigger }: { trigger: number }) {
  const map = useMap()

  useEffect(() => {
    if (trigger === 0) return
    const center = map.getCenter()
    const size = map.getSize()
    const smallerDim = Math.min(size.x, size.y)
    const diameterMeters = FORAGING_RADIUS * 2
    const targetMpp = diameterMeters / (smallerDim * 0.75)
    const latRad = center.lat * Math.PI / 180
    const zoom = Math.log2((156543.03392 * Math.cos(latRad)) / targetMpp)
    map.setZoom(Math.round(zoom))
  }, [trigger, map])

  return null
}

export function MapPickerSheet({ open, onClose, onConfirm, initialLat, initialLng }: MapPickerSheetProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [geolocating, setGeolocating] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [zoomFitTrigger, setZoomFitTrigger] = useState(0)
  const [satellite, setSatellite] = useState(false)

  const mapCenter = initialLat != null && initialLng != null
    ? { lat: initialLat, lng: initialLng }
    : ITALY_CENTER
  const initialZoom = initialLat != null && initialLng != null ? 16 : 6

  useEffect(() => {
    if (!open) {
      setReady(false)
      setCenter(null)
      return
    }
    setReady(true)
  }, [open])

  const handleCenterChange = useCallback((lat: number, lng: number) => {
    setCenter({ lat, lng })
  }, [])

  const handleLocate = () => {
    if (!navigator.geolocation) return
    setGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTarget({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeolocating(false)
      },
      () => {
        setGeolocating(false)
      },
      { timeout: 10000, maximumAge: 30000 },
    )
  }

  const handleConfirm = () => {
    if (center) onConfirm(center.lat, center.lng)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-cream-50 flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2">
        <button
          type="button"
          aria-label="Chiudi"
          onClick={onClose}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <X size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-base font-semibold text-wood-800 tracking-tight flex-1 px-1">
          Seleziona posizione
        </h1>
        {geolocating && (
          <span className="text-xs text-wood-400 animate-pulse">Localizzazione…</span>
        )}
        <button
          type="button"
          onClick={() => setZoomFitTrigger((n) => n + 1)}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
          aria-label="Zoom per raggio 3km"
        >
          <Maximize2 size={20} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setSatellite((v) => !v)}
          className={`size-11 flex items-center justify-center rounded-md transition-colors ${satellite ? 'bg-honey-300/60 text-honey-700' : 'text-wood-700 hover:bg-cream-100'}`}
          aria-label={satellite ? 'Mappa standard' : 'Satellite'}
        >
          {satellite ? <MapIcon size={20} strokeWidth={1.75} /> : <Satellite size={20} strokeWidth={1.75} />}
        </button>
        <button
          type="button"
          onClick={handleLocate}
          disabled={geolocating}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors disabled:opacity-50"
          aria-label="Localizza"
        >
          <LocateFixed size={20} strokeWidth={1.75} />
        </button>
      </header>

      {/* Map area */}
      <div className="flex-1 relative bg-wood-300" data-allow-pinch>
        {ready && (
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={initialZoom}
            className="absolute inset-0"
            zoomControl={false}
            attributionControl={false}
          >
            {satellite ? (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}
            {center && (
              <Circle
                center={[center.lat, center.lng]}
                radius={FORAGING_RADIUS}
                pathOptions={{
                  color: '#C7891A',
                  fillColor: '#C7891A',
                  fillOpacity: 0.08,
                  weight: 2,
                  dashArray: '6 3',
                }}
              />
            )}
            <CenterTracker onChange={handleCenterChange} />
            <FlyController target={flyTarget} />
            <ZoomToFit trigger={zoomFitTrigger} />
          </MapContainer>
        )}
      </div>

      {/* Coordinate readout */}
      {center && (
        <div className="absolute left-3 pointer-events-none z-20" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          <span className="inline-block bg-cream-50/90 backdrop-blur-sm rounded px-2.5 py-1 text-xs font-medium text-wood-700 tabular-nums">
            {center.lat.toFixed(6)} · {center.lng.toFixed(6)}
          </span>
        </div>
      )}

      {/* Sticky CTA */}
      <div
        className="shrink-0 bg-cream-50 border-t border-cream-200 px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleConfirm}
          disabled={!center}
        >
          Conferma posizione
        </Button>
      </div>
    </div>
  )
}
