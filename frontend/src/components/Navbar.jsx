import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FileText, Upload, Clock, LogOut, Zap } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const links = [
    { to: '/', label: 'Dashboard', icon: Zap },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/history', label: 'History', icon: Clock },
  ]

  return (
    <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-sky-400">
          <FileText size={22} />
          Textify
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === to
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">{user.name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-2"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}
