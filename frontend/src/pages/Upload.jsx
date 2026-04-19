import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, Play, Pause, Download, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../api'

const LANGUAGES = [
  { value: 'eng', label: 'English' },
  { value: 'hin', label: 'Hindi' },
  { value: 'eng+hin', label: 'English + Hindi' },
]

const SUMMARY_STYLES = [
  { value: 'concise', label: 'Concise (3-5 sentences)' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'bullets', label: 'Bullet Points' },
]

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)
  const [language, setLanguage] = useState('eng')
  const [summaryStyle, setSummaryStyle] = useState('concise')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [tab, setTab] = useState('summary')
  const audioRef = useRef(null)
  const navigate = useNavigate()

  const handleFile = (f) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'application/pdf']
    if (!allowed.includes(f.type)) {
      toast.error('Unsupported file. Use JPG, PNG, PDF, etc.')
      return
    }
    setFile(f)
    setResult(null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const submit = async () => {
    if (!file) return toast.error('Please select a file')
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('summary_style', summaryStyle)
    formData.append('tts_lang', language === 'hin' ? 'hi' : 'en')

    try {
      const { data } = await API.post('/document/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      setResult(data)
      toast.success('Document processed!')

      // Setup audio
      if (data.audio_base64) {
        const blob = new Blob(
          [Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0))],
          { type: 'audio/mp3' }
        )
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob)
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Processing failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  const exportTxt = async () => {
    if (!result?.doc_id) return
    const res = await fetch(`/api/document/export/${result.doc_id}?format=txt`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `textify_${result.filename}.txt`
    a.click()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">Upload Document</h1>
      <p className="text-gray-400 mb-8">Extract text, summarize, and listen — all in one click.</p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('fileInput').click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors mb-6
          ${drag ? 'border-sky-500 bg-sky-500/5' : 'border-gray-700 hover:border-gray-500'}`}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText size={24} className="text-sky-400" />
            <span className="text-white font-medium">{file.name}</span>
            <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="text-gray-500 hover:text-red-400 transition-colors">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={36} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">Drop file here or click to browse</p>
            <p className="text-gray-500 text-sm mt-1">JPG, PNG, PDF, BMP, TIFF supported</p>
          </>
        )}
      </div>

      {/* Options */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">OCR Language</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="input"
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Summary Style</label>
          <select
            value={summaryStyle}
            onChange={e => setSummaryStyle(e.target.value)}
            className="input"
          >
            {SUMMARY_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <button onClick={submit} disabled={loading || !file} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <><Loader size={18} className="animate-spin" /> Processing...</> : <><Upload size={18} /> Process Document</>}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-8">
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  ✓ Processed
                </span>
                <span className="text-sm text-gray-400">{result.word_count} words · {result.reduction} reduced</span>
              </div>
              <div className="flex gap-2">
                {result.audio_base64 && (
                  <button onClick={toggleAudio} className="btn-ghost flex items-center gap-2 text-sm py-2 px-3">
                    {playing ? <Pause size={15} /> : <Play size={15} />}
                    {playing ? 'Pause' : 'Listen'}
                  </button>
                )}
                <button onClick={exportTxt} className="btn-ghost flex items-center gap-2 text-sm py-2 px-3">
                  <Download size={15} /> Export
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-4">
              {['summary', 'full text'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize
                    ${tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-gray-800 rounded-xl p-4 max-h-72 overflow-y-auto">
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {tab === 'summary' ? result.summary || 'No summary generated.' : result.extracted_text}
              </p>
            </div>
          </div>

          <button onClick={() => navigate(`/document/${result.doc_id}`)} className="btn-ghost w-full text-sm">
            View Full Document →
          </button>

          <audio ref={audioRef} onEnded={() => setPlaying(false)} className="hidden" />
        </div>
      )}
    </div>
  )
}
