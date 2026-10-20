import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import { useAuth } from '../../lib/AuthContext'
import { useToast } from '../../lib/ToastContext'
import { ILIGAN_BARANGAYS } from '../../lib/constants'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    barangay: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const data = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        barangay: form.barangay,
        role: 'client',
      })
      if (data.session) {
        toast.success('Account created. Happy ordering!')
        navigate('/', { replace: true })
      } else {
        toast.info('Check your email to confirm your account, then sign in.')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-md px-4 py-16 sm:py-24">
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-mint text-2xl">🥟</div>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-ink-muted">Order from every pater house in Iligan.</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-4xl border border-ink/10 p-6">
        <Input
          label="Full name"
          name="fullName"
          placeholder="Juan Dela Cruz"
          autoComplete="name"
          value={form.fullName}
          onChange={set('fullName')}
          required
        />
        <Input
          label="Mobile number"
          name="phone"
          placeholder="0917 000 0000"
          autoComplete="tel"
          value={form.phone}
          onChange={set('phone')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Street / landmark (optional)"
            name="address"
            placeholder="Rizal Ave, near…"
            value={form.address}
            onChange={set('address')}
          />
          <Select label="Barangay (optional)" name="barangay" value={form.barangay} onChange={set('barangay')}>
            <option value="">Select barangay…</option>
            {ILIGAN_BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={form.email}
          onChange={set('email')}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={set('password')}
          required
        />
        {error && (
          <p className="rounded-2xl bg-blush px-3 py-2 text-sm font-medium text-pink-900">{error}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          By continuing you agree to our community guidelines.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-ink hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
