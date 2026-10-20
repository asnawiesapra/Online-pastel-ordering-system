const R = 6371

export function haversineKm(a, b) {
  if (!a || !b) return 0
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

const AVG_SPEED_KMH = 20

export function etaMinutes(store, point) {
  const prep = Number(store?.prep_minutes ?? 20)
  if (!store?.lat || !point?.lat) return prep
  const km = haversineKm({ lat: Number(store.lat), lng: Number(store.lng) }, point)
  const travel = Math.max(4, Math.round((km / AVG_SPEED_KMH) * 60))
  return prep + travel
}

export function distanceKm(store, point) {
  if (!store?.lat || !point?.lat) return 0
  return haversineKm({ lat: Number(store.lat), lng: Number(store.lng) }, point)
}

export function formatDistance(km) {
  if (!km) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// Order status label helper for the delivery tracking view.
export function riderEta(eta) {
  if (!eta) return null
  return `${eta} min`
}
