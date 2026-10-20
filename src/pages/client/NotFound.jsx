import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-2xl place-items-center px-4 py-28 text-center">
      <div className="grid size-24 place-items-center rounded-5xl bg-canvas-2 text-5xl">🥟</div>
      <h1 className="mt-8 font-display text-5xl font-bold tracking-tight">404</h1>
      <p className="mt-3 text-sm text-ink-muted">
        This page went missing — maybe someone ate it. Let&apos;s get you back to the pater.
      </p>
      <div className="mt-8 flex gap-3">
        <Button as={Link} to="/">
          Back home
        </Button>
        <Button as={Link} to="/stores" variant="outline">
          Browse pater houses
        </Button>
      </div>
    </div>
  )
}
