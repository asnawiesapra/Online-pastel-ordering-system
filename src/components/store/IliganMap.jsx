import { useMemo, useState } from 'react'
import { accent, peso } from '../../lib/constants'
import { sizedImage } from '../../lib/images'
import { StoreAvatar } from './StoreAvatar'

function project(lat, lng, bounds, w, h, pad = 0) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (w - pad * 2) + pad
  const y = h - (((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (h - pad * 2) + pad)
  return { x, y }
}

const W = 900
const H = 620
const bounds = { minLat: 8.205, maxLat: 8.262, minLng: 124.220, maxLng: 124.285 }

export function IliganMap({ stores = [], selectedId, onSelect, className = '' }) {
  const [hovered, setHovered] = useState(null)

  const pins = useMemo(
    () =>
      stores.map((store) => ({
        store,
        ...project(Number(store.lat), Number(store.lng), bounds, W, H, 64),
      })),
    [stores],
  )

  const activeId = hovered ?? selectedId
  const active = pins.find((p) => p.store.id === activeId)?.store

  return (
    <div
      className={[
        'map-canvas relative overflow-hidden rounded-4xl border border-ink/10',
        className,
      ].join(' ')}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Illustrated map of Iligan City with pater house locations"
      >
        <defs>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eef7e6" />
            <stop offset="55%" stopColor="#e2f1d4" />
            <stop offset="100%" stopColor="#d6ebc4" />
          </linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe4f7" />
            <stop offset="100%" stopColor="#8fcbe8" />
          </linearGradient>
          <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a9dbf2" />
            <stop offset="100%" stopColor="#7cc4e6" />
          </linearGradient>
          <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cfe8b5" />
            <stop offset="100%" stopColor="#b7dc98" />
          </linearGradient>
          <radialGradient id="shore-glow" cx="0.15" cy="1" r="0.8">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <pattern id="map-dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.1" fill="#c7dfae" opacity="0.55" />
          </pattern>
          <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0a0a0a" floodOpacity="0.25" />
          </filter>
          <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#14351f" floodOpacity="0.12" />
          </filter>
          <clipPath id="pin-clip">
            <circle cx="0" cy="-12" r="10" />
          </clipPath>
        </defs>

        {/* Land base */}
        <rect width={W} height={H} fill="url(#land)" />
        <rect width={W} height={H} fill="url(#map-dots)" />

        {/* Rolling hills / mountains (north-east) */}
        <g filter="url(#soft-shadow)">
          <path
            d={`M${W * 0.66} 0 L${W * 0.72} ${H * 0.16} L${W * 0.8} ${H * 0.09} L${W * 0.86} 0 Z`}
            fill="url(#hill)"
          />
          <path
            d={`M${W * 0.78} 0 L${W * 0.86} ${H * 0.2} L${W} ${H * 0.14} L${W} 0 Z`}
            fill="url(#hill)"
            opacity="0.85"
          />
        </g>

        {/* Iligan Bay */}
        <path
          d={`M0 ${H} L0 ${H * 0.6} Q ${W * 0.1} ${H * 0.64} ${W * 0.22} ${H * 0.78} T ${W * 0.45} ${H} Z`}
          fill="url(#sea)"
        />
        <path
          d={`M0 ${H * 0.6} Q ${W * 0.1} ${H * 0.64} ${W * 0.22} ${H * 0.78} T ${W * 0.45} ${H}`}
          fill="url(#shore-glow)"
        />

        {/* Animated waves */}
        <g stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d={`M${W * 0.05} ${H * 0.74} q 20 -8 40 0 t 40 0 t 40 0`}>
            <animate attributeName="stroke-dashoffset" values="0;-160" dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.6;0.15" dur="4s" repeatCount="indefinite" />
          </path>
          <path d={`M${W * 0.02} ${H * 0.84} q 20 -8 40 0 t 40 0 t 40 0 t 40 0`}>
            <animate attributeName="stroke-dashoffset" values="0;-160" dur="7.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.5;0.1" dur="5s" repeatCount="indefinite" />
          </path>
        </g>
        <text
          x={W * 0.12}
          y={H * 0.92}
          className="fill-[#3f8fb5]"
          fontSize="20"
          fontStyle="italic"
          fontWeight="600"
        >
          Iligan Bay
        </text>

        {/* Agus / Mandulog river */}
        <g strokeLinecap="round" fill="none">
          <path
            d={`M${W * 0.55} 0 Q ${W * 0.6} ${H * 0.18} ${W * 0.72} ${H * 0.3} T ${W} ${H * 0.42}`}
            stroke="url(#river)"
            strokeWidth="15"
          />
          <path
            d={`M${W * 0.55} 0 Q ${W * 0.6} ${H * 0.18} ${W * 0.72} ${H * 0.3} T ${W} ${H * 0.42}`}
            stroke="#d6eefb"
            strokeWidth="5"
            opacity="0.7"
          />
        </g>

        {/* Roads */}
        <g stroke="#e7b57a" strokeWidth="9" strokeLinecap="round" fill="none" filter="url(#soft-shadow)">
          <path d={`M60 ${H * 0.42} L ${W * 0.34} ${H * 0.5} L ${W * 0.62} ${H * 0.44} L ${W - 60} ${H * 0.5}`} />
          <path d={`M${W * 0.34} ${60} L ${W * 0.36} ${H * 0.5} L ${W * 0.3} ${H - 40}`} />
          <path d={`M${W * 0.62} ${H * 0.44} L ${W * 0.66} ${H - 60}`} />
        </g>
        <g stroke="#fff4e2" strokeWidth="2.2" strokeDasharray="10 12" strokeLinecap="round" fill="none">
          <path d={`M60 ${H * 0.42} L ${W * 0.34} ${H * 0.5} L ${W * 0.62} ${H * 0.44} L ${W - 60} ${H * 0.5}`} />
          <path d={`M${W * 0.34} ${60} L ${W * 0.36} ${H * 0.5} L ${W * 0.3} ${H - 40}`} />
          <path d={`M${W * 0.62} ${H * 0.44} L ${W * 0.66} ${H - 60}`} />
        </g>

        {/* City blocks */}
        <g fill="#f7fbf1" stroke="#d9ebc6" strokeWidth="1.2">
          <rect x={W * 0.3} y={H * 0.36} width="90" height="46" rx="10" />
          <rect x={W * 0.44} y={H * 0.26} width="120" height="60" rx="12" />
          <rect x={W * 0.5} y={H * 0.56} width="100" height="54" rx="10" />
          <rect x={W * 0.2} y={H * 0.22} width="80" height="44" rx="10" />
          <rect x={W * 0.68} y={H * 0.62} width="110" height="52" rx="10" />
          <rect x={W * 0.12} y={H * 0.52} width="86" height="42" rx="10" />
        </g>

        {/* Barangay labels */}
        <g className="fill-[#7fae5d]" fontSize="13" fontWeight="700" letterSpacing="1">
          <text x={W * 0.31} y={H * 0.33}>POBLACION</text>
          <text x={W * 0.45} y={H * 0.22}>SUAREZ</text>
          <text x={W * 0.21} y={H * 0.19}>HINAPLANON</text>
          <text x={W * 0.49} y={H * 0.53}>PALA-O</text>
          <text x={W * 0.67} y={H * 0.59}>TAMBACAN</text>
          <text x={W * 0.1} y={H * 0.49}>DEL CARMEN</text>
        </g>

        {/* Animated delivery route along the main road */}
        <path
          id="route"
          d={`M60 ${H * 0.42} L ${W * 0.34} ${H * 0.5} L ${W * 0.62} ${H * 0.44} L ${W - 60} ${H * 0.5}`}
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="3"
          strokeDasharray="12 14"
          strokeLinecap="round"
          opacity="0.55"
        >
          <animate attributeName="stroke-dashoffset" values="0;-260" dur="9s" repeatCount="indefinite" />
        </path>

        {/* Pins */}
        {pins.map(({ store, x, y }) => {
          const isActive = store.id === activeId
          const a = accent(store.accent)
          const photo = sizedImage(store.image_url, 'thumb')
          return (
            <g
              key={store.id}
              transform={`translate(${x} ${y})`}
              className="cursor-pointer transition-transform"
              onMouseEnter={() => setHovered(store.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(store)}
            >
              {isActive && (
                <circle r="26" fill={a.hex} opacity="0.6">
                  <animate attributeName="r" values="20;30;20" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <g filter="url(#pin-shadow)" transform={`scale(${isActive ? 1.18 : 1})`}>
                <path
                  d="M0 -30 C -13 -30 -22 -21 -22 -10 C -22 4 0 26 0 26 C 0 26 22 4 22 -10 C 22 -21 13 -30 0 -30 Z"
                  fill={isActive ? a.hex : '#0a0a0a'}
                  stroke="#fff"
                  strokeWidth="3"
                />
                {photo ? (
                  <>
                    <circle cx="0" cy="-12" r="10" fill="#fff" />
                    <image
                      href={photo}
                      x="-10"
                      y="-22"
                      width="20"
                      height="20"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath="url(#pin-clip)"
                    />
                  </>
                ) : (
                  <circle cx="0" cy="-11" r="9" fill={isActive ? '#fff' : a.hex} />
                )}
              </g>
              {isActive && (
                <text y="46" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-ink">
                  {store.name}
                </text>
              )}
            </g>
          )
        })}

        {/* Compass */}
        <g transform={`translate(${W - 60} 60)`} opacity="0.85">
          <circle r="26" fill="#ffffff" stroke="#d9ebc6" strokeWidth="2" />
          <path d="M0 -18 L6 0 L0 18 L-6 0 Z" fill="#e11d48" />
          <path d="M0 18 L6 0 L-6 0 Z" fill="#0a0a0a" opacity="0.5" />
          <text y="-30" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-ink">
            N
          </text>
        </g>

        {/* Scale bar */}
        <g transform={`translate(60 ${H - 34})`}>
          <rect x="0" y="0" width="70" height="6" fill="#0a0a0a" opacity="0.7" rx="2" />
          <text x="78" y="7" fontSize="11" fontWeight="600" className="fill-ink-muted">
            2 km
          </text>
        </g>
      </svg>

      {/* Active store card */}
      {active && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 animate-pop sm:right-auto sm:max-w-xs">
          <div className="pointer-events-auto overflow-hidden rounded-3xl border border-ink/10 bg-white/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
            {sizedImage(active.image_url, 'card') && (
              <img
                src={sizedImage(active.image_url, 'card')}
                alt=""
                className="h-24 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <StoreAvatar store={active} size="md" rounded="2xl" />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold leading-tight">
                    {active.name}
                  </p>
                  <p className="text-xs text-ink-muted">Brgy. {active.barangay}</p>
                  <p className="mt-1 text-xs text-ink-muted">{active.address}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-semibold">⭐ {active.rating}</span>
                <span className="text-ink-muted">Delivery {peso(active.delivery_fee)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
