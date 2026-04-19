import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Pause, Download, Trash2, FileText, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../api'

export default function DocumentView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('summary')
  const [playing, setPlaying] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    API.get(`/document/${id}`)
      .then(({ data }) => setDoc(data))
      .catch(() => { toast.error('Document not found'); navigate('/history') })
      .finally(() => setLoading(false))
  }, [id])

  const loadAndPlayAudio = async () => {
    console.log('loadAndPlayAudio called', { id, tab, useSummary: tab !== 'full text', playing, hasSrc: !!audioRef.current?.src })
    if (audioRef.current?.src && audioRef.current.src !== window.location.href) {
      toggleAudio(); return
    }
    setAudioLoading(true)
    try {
      const useSummary = tab !== 'full text'
      console.log('Calling TTS API:', `/document/tts/${id}?use_summary=${useSummary}`)
      const { data } = await API.get(`/document/tts/${id}?use_summary=${useSummary}`)
      console.log('TTS Response:', { hasAudio: !!data.audio_base64, length: data.audio_base64?.length || 0 })
      if (!data.audio_base64) throw new Error('No audio_base64 in response')
      const blob = new Blob(
        [Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      )
      console.log('Blob created:', blob.size, 'bytes')
      audioRef.current.src = URL.createObjectURL(blob)
      audioRef.current.play()
      setPlaying(true)
    } catch (err) {
      console.error('Audio error:', err)
      toast.error('Audio generation failed: ' + err.message)
    } finally {
      setAudioLoading(false)
    }
  }

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  const exportTxt = async () => {
    const res = await fetch(`/api/document/export/${id}?format=txt`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `textify_${doc.filename}.txt`; a.click()
  }

  const deleteDoc = async () => {
    if (!confirm('Delete this document?')) return
    await API.delete(`/document/${id}`)
    toast.success('Deleted')
    navigate('/history')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <Loader size={24} className="animate-spin text-sky-400" />
    </div>
  )

  if (!doc) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => navigate('/history')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft size={16} /> Back to History
      </button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="bg-gray-800 p-3 rounded-xl shrink-0">
            <FileText size={22} className="text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{doc.filename}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(doc.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: `${doc.word_count} words` },
                { label: `${doc.reduction} reduction` },
                { label: doc.language === 'hin' ? 'Hindi' : doc.language === 'eng+hin' ? 'Eng+Hindi' : 'English' },
                { label: doc.summary_style },
              ].map(tag => (
                <span key={tag.label} className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full capitalize">
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5 flex-wrap">

          <button onClick={exportTxt} className="btn-ghost flex items-center gap-2 text-sm py-2">
            <Download size={15} /> Export TXT
          </button>
          <button onClick={deleteDoc}
            className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="card">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-5">
          {['summary', 'full text'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize
                ${tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-5 max-h-96 overflow-y-auto">
          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {tab === 'summary'
              ? doc.summary || 'No summary available.'
              : doc.extracted_text || 'No text extracted.'}
          </p>
        </div>
      </div>

      {doc.file_url && (
        <div className="mt-4 card">
          <p className="text-xs text-gray-500 mb-2">Original file</p>
          <a href={doc.file_url} target="_blank" rel="noreferrer"
            className="text-sky-400 text-sm hover:underline break-all">
            {doc.file_url}
          </a>
        </div>
      )}

      <audio ref={audioRef} onEnded={() => setPlaying(false)} className="hidden" />
    </div>
  )
}
