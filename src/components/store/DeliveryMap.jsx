import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import { useEffect, useMemo } from 'react'
import { ILIGAN_CENTER } from '../../lib/geocode'

function pinIcon(color = '#0a0a0a', glyph = '📍') {
  return L.divIcon({
    className: 'pastel-pin',
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 50%;
      background:${color};border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);
      display:grid;place-items:center;font-size:16px;">${glyph}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

export function DeliveryMap({ store, point, className = '', height = 260 }) {
  const storePos = useMemo(
    () => (store?.lat && store?.lng ? { lat: Number(store.lat), lng: Number(store.lng) } : null),
    [store],
  )
  const dropPos = point?.lat && point?.lng ? { lat: Number(point.lat), lng: Number(point.lng) } : null

  const center = dropPos ?? storePos ?? ILIGAN_CENTER

  return (
    <div
      className={['overflow-hidden rounded-3xl border border-ink/10', className].join(' ')}
      style={{ height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={dropPos && storePos ? 14 : 13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {storePos && (
          <Marker position={[storePos.lat, storePos.lng]} icon={pinIcon('#0a0a0a', '🏪')}>
            <Tooltip>{store?.name ?? 'Store'}</Tooltip>
          </Marker>
        )}
        {dropPos && (
          <Marker position={[dropPos.lat, dropPos.lng]} icon={pinIcon('#e11d48', '📍')}>
            <Tooltip>{point?.label ?? 'Delivery address'}</Tooltip>
          </Marker>
        )}
        {storePos && dropPos && (
          <Polyline
            positions={[
              [storePos.lat, storePos.lng],
              [dropPos.lat, dropPos.lng],
            ]}
            pathOptions={{ color: '#0a0a0a', weight: 3, dashArray: '6 8', opacity: 0.6 }}
          />
        )}
      </MapContainer>
    </div>
  )
}

export function useLeafletFix() {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl
  }, [])
}

export function LiveStoreMap({ stores = [], selectedId, onSelect, className = '', height = 480 }) {
  const withCoords = useMemo(
    () => stores.filter((s) => s.lat && s.lng),
    [stores],
  )
  const first = withCoords[0]
  const center = first
    ? { lat: Number(first.lat), lng: Number(first.lng) }
    : ILIGAN_CENTER

  return (
    <div
      className={['overflow-hidden rounded-4xl border border-ink/10', className].join(' ')}
      style={{ height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((store) => {
          const isActive = store.id === selectedId
          return (
            <Marker
              key={store.id}
              position={[Number(store.lat), Number(store.lng)]}
              icon={pinIcon(isActive ? '#e11d48' : '#0a0a0a', store.hero_emoji ?? '🥟')}
              eventHandlers={{ click: () => onSelect?.(store) }}
            >
              <Tooltip>{store.name}</Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
