import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { useAuth } from '../../lib/AuthContext'
import { useToast } from '../../lib/ToastContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await signIn({ email, password })
      toast.success('Welcome back!')
      const from = location.state?.from
      if (from) navigate(from, { replace: true })
      else navigate('/', { replace: true })
      void user
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-md px-4 py-16 sm:py-24">
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-ink text-2xl text-white">
          🥟
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-muted">Sign in to order, track, and manage.</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-4xl border border-ink/10 p-6">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="rounded-2xl bg-blush px-3 py-2 text-sm font-medium text-pink-900">{error}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-ink hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Running a store?{' '}
        <Link to="/become-a-store" className="font-semibold text-ink hover:underline">
          Apply to sell
        </Link>
      </p>
    </div>
  )
}
