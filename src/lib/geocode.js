const NOMINATIM = 'https://nominatim.openstreetmap.org'

export const ILIGAN_CENTER = { lat: 8.228, lng: 124.2452 }

const VIEWBOX = '124.15,8.28,124.35,8.15'

// Official Iligan City barangay names (kept here to avoid a circular import).
const BARANGAYS = [
  'Abuno', 'Acmac-Mariano Badelles Sr.', 'Bagong Silang', 'Bonbonon', 'Bunawan',
  'Buru-un', 'Dalipuga', 'Del Carmen', 'Digkilaan', 'Ditucalan', 'Dulag',
  'Hinaplanon', 'Hindang', 'Kabacsanan', 'Kalilangan', 'Kiwalan', 'Lanipao',
  'Luinab', 'Mahayahay', 'Mainit', 'Mandulog', 'Maria Cristina', 'Pala-o',
  'Panoroganan', 'Poblacion', 'Puga-an', 'Rogongon', 'San Miguel', 'San Roque',
  'Santa Elena', 'Santa Filomena', 'Santiago', 'Santo Rosario', 'Saray',
  'Suarez', 'Tambacan', 'Tibanga', 'Tipanoy', 'Tomas L. Cabili', 'Tubod',
  'Ubaldo Laya', 'Upper Hinaplanon', 'Upper Tominobo', 'Villa Verde',
]

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\b(barangay|brgy\.?|bgy\.?)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Snap a raw Nominatim place name (e.g. "Pala-o", "Brgy Poblacion") onto the
// official barangay list. Returns '' when nothing reasonable matches.
export function matchBarangay(...candidates) {
  const normBarangays = BARANGAYS.map((b) => ({ name: b, norm: normalize(b) }))
  for (const candidate of candidates) {
    const n = normalize(candidate)
    if (!n) continue
    const exact = normBarangays.find((b) => b.norm === n)
    if (exact) return exact.name
    const partial = normBarangays.find((b) => b.norm.includes(n) || n.includes(b.norm))
    if (partial) return partial.name
  }
  return ''
}

function withViewbox(url) {
  return `${url}&viewbox=${VIEWBOX}&bounded=0`
}

export async function searchAddress(query, { limit = 6, signal } = {}) {
  if (!query || query.trim().length < 3) return []
  const url = withViewbox(
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=ph&q=${encodeURIComponent(
      query,
    )}`,
  )
  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Address search failed')
  const data = await res.json()
  return data.map((r) => {
    const a = r.address ?? {}
    const raw = a.suburb || a.village || a.neighbourhood || a.quarter || ''
    return {
      id: String(r.place_id),
      label: r.display_name,
      shortLabel: [a.road, raw, a.city].filter(Boolean).join(', ') || r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
      barangay: matchBarangay(raw, a.city_district, a.hamlet) || raw || '',
      rawBarangay: raw,
      landmark: a.road || a.amenity || a.building || '',
      city: a.city || a.town || '',
    }
  })
}

export async function reverseGeocode(lat, lng, { signal } = {}) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=16&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const r = await res.json()
  const a = r.address ?? {}
  const raw = a.suburb || a.village || a.neighbourhood || a.quarter || a.hamlet || ''
  return {
    label: r.display_name ?? '',
    shortLabel: [a.road, raw, a.city].filter(Boolean).join(', '),
    barangay: matchBarangay(raw, a.city_district, a.hamlet) || raw || '',
    rawBarangay: raw,
    landmark: a.road || a.amenity || a.building || a.neighbourhood || '',
    city: a.city || a.town || '',
    postcode: a.postcode || '',
  }
}

