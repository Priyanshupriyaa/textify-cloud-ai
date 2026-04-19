# Textify 2.0 — Intelligent Document Accessibility Platform

Extract text from any image or PDF, summarize it with AI, and listen to it — all for free.

## Tech Stack
- **Backend**: Flask, Python, MongoDB Atlas
- **Frontend**: React + Tailwind CSS + Vite
- **OCR**: OCR Space API (free tier)
- **AI**: Groq API — llama3-8b-8192 (free)
- **TTS**: gTTS (lightweight)
- **Storage**: Cloudinary (free tier)
- **Auth**: JWT

> ✅ Runs under 512MB RAM — no torch, no transformers, no opencv

---

## Setup (Local)

### 1. Clone & Backend

```bash
cd textify
pip install -r requirements.txt

cp .env.example .env
# Fill in your keys in .env

python app.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Free API Keys (all free tier)

| Service | Get Key |
|---|---|
| OCR Space | https://ocr.space/ocrapi (free: 500 req/day) |
| Groq | https://console.groq.com (free) |
| MongoDB Atlas | https://mongodb.com/atlas (free 512MB) |
| Cloudinary | https://cloudinary.com (free 25GB) |

---

## Deploy

### Backend → Render
1. Push to GitHub
2. New Web Service on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add all env variables from `.env.example`

### Frontend → Vercel
1. `cd frontend && npm run build`
2. Deploy `dist/` folder on Vercel
3. Set `VITE_API_URL` = your Render backend URL

---

## Features
- ✅ Upload image or PDF
- ✅ OCR in English, Hindi, or both
- ✅ AI summarization (concise / detailed / bullets)
- ✅ Text-to-speech on summary or full text
- ✅ Export as TXT
- ✅ Document history with pagination
- ✅ JWT authentication
- ✅ Responsive dark UI
