import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Clock, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import API from '../api'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [recentDocs, setRecentDocs] = useState([])
  const [stats, setStats] = useState({ total: 0 })

  useEffect(() => {
    API.get('/document/history?limit=3').then(({ data }) => {
      setRecentDocs(data.documents)
      setStats({ total: data.total })
    }).catch(() => {})
  }, [])

  const statCards = [
    { label: 'Docs Processed', value: stats.total, icon: FileText, color: 'text-sky-400' },
    { label: 'Time Saved (est.)', value: `${Math.round(stats.total * 4)}m`, icon: TrendingUp, color: 'text-emerald-400' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, {user.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400">Extract, summarize, and listen to any document.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`${color} bg-gray-800 p-3 rounded-xl`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Link to="/upload" className="card hover:border-sky-500/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500/20 text-sky-400 p-4 rounded-xl">
              <Upload size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Upload Document</h3>
              <p className="text-sm text-gray-400">Image or PDF → Text + Summary</p>
            </div>
            <ArrowRight size={18} className="text-gray-600 group-hover:text-sky-400 transition-colors" />
          </div>
        </Link>

        <Link to="/history" className="card hover:border-gray-600 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="bg-gray-800 text-gray-400 p-4 rounded-xl">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">View History</h3>
              <p className="text-sm text-gray-400">All processed documents</p>
            </div>
            <ArrowRight size={18} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Docs */}
      {recentDocs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
            <Link to="/history" className="text-sm text-sky-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentDocs.map(doc => (
              <Link key={doc._id} to={`/document/${doc._id}`}
                className="card flex items-center gap-4 hover:border-gray-600 transition-colors"
              >
                <div className="bg-gray-800 p-2.5 rounded-lg">
                  <FileText size={18} className="text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-400">
                    {doc.word_count} words · {doc.reduction} reduction · {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentDocs.length === 0 && (
        <div className="card text-center py-14">
          <FileText size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No documents yet. Upload your first one!</p>
          <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
            <Upload size={16} /> Upload Now
          </Link>
        </div>
      )}
    </div>
  )
}
