import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await API.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate('/')
    } catch (err) {
      console.error('Login error:', err.response || err)
      toast.error(err.response?.data?.error || 'Login failed: Check console/server logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sky-400 font-bold text-2xl mb-2">
            <FileText size={28} /> Textify
          </div>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-sky-400 hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
