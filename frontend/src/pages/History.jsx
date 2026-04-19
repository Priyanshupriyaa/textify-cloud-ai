import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Trash2, ArrowRight, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../api'

export default function History() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const LIMIT = 10

  const fetchDocs = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await API.get(`/document/history?page=${p}&limit=${LIMIT}`)
      setDocs(data.documents)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs(page) }, [page])

  const deleteDoc = async (id, e) => {
    e.preventDefault()
    if (!confirm('Delete this document?')) return
    try {
      await API.delete(`/document/${id}`)
      toast.success('Deleted')
      fetchDocs(page)
    } catch {
      toast.error('Delete failed')
    }
  }

  const filtered = docs.filter(d =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Document History</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} documents processed</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9 w-56"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-20 bg-gray-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <FileText size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No documents found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <Link key={doc._id} to={`/document/${doc._id}`}
              className="card flex items-center gap-4 hover:border-gray-600 transition-colors group"
            >
              <div className="bg-gray-800 p-2.5 rounded-lg shrink-0">
                <FileText size={18} className="text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{doc.filename}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {doc.word_count} words · {doc.reduction} reduction ·{' '}
                  {new Date(doc.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => deleteDoc(doc._id, e)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                >
                  <Trash2 size={15} />
                </button>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-ghost text-sm py-2 px-4 disabled:opacity-40">
            ← Prev
          </button>
          <span className="flex items-center text-sm text-gray-400 px-3">
            Page {page} of {Math.ceil(total / LIMIT)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}
            className="btn-ghost text-sm py-2 px-4 disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
