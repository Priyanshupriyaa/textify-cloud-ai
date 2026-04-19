import requests
import os
import base64
from gtts import gTTS
import tempfile

OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
OCR_URL = "https://api.ocr.space/parse/image"


def extract_text_from_image(file_bytes: bytes, filename: str, language: str = "eng") -> dict:
    try:
        ## print("OCR_SPACE_API_KEY =", OCR_SPACE_API_KEY)

        is_pdf = filename.lower().endswith(".pdf")

        payload = {
            "apikey": OCR_SPACE_API_KEY,
            "language": language,
            "isOverlayRequired": False,
            "detectOrientation": True,
            "scale": True,
            "OCREngine": 2,
        }

        if is_pdf:
            payload["isPdf"] = True

        files = {"file": (filename, file_bytes)}

        response = requests.post(
            OCR_URL,
            files=files,
            data=payload,
            timeout=30
        )

        # 🔍 Handle non-JSON responses safely
        try:
            result = response.json()
        except Exception:
            return {
                "success": False,
                "error": f"OCR API returned non-JSON response: {response.text}"
            }

        if not isinstance(result, dict):
            return {
                "success": False,
                "error": f"Unexpected OCR response: {result}"
            }

        if result.get("IsErroredOnProcessing"):
            return {
                "success": False,
                "error": result.get("ErrorMessage", ["OCR failed"])[0]
            }

        parsed = result.get("ParsedResults", [])

        if not parsed:
            return {
                "success": False,
                "error": "No text found in image"
            }

        full_text = " ".join(
            p["ParsedText"] for p in parsed
        ).strip()

        return {
            "success": True,
            "text": full_text,
            "word_count": len(full_text.split())
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def summarize_text(text: str, style: str = "concise") -> dict:
    """Summarize text using Groq API (llama3)"""
    print("GROQ_API_KEY =", GROQ_API_KEY)
    try:
        if len(text.split()) < 30:
            return {"success": True, "summary": text, "note": "Text too short to summarize"}

        prompts = {
            "concise": f"Summarize this text in 3-5 concise sentences. Focus on key points only:\n\n{text}",
            "detailed": f"Provide a detailed summary of this text with main topics and key insights:\n\n{text}",
            "bullets": f"Summarize this text as 5-7 clear bullet points. Start each with '•':\n\n{text}",
        }

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompts.get(style, prompts["concise"])}],
            "max_tokens": 500,
            "temperature": 0.3,
        }

        response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
        data = response.json()
        print("Groq response:", data)

        if "error" in data:
            return {"success": False, "error": data["error"].get("message", "Groq API error")}

        summary = data["choices"][0]["message"]["content"].strip()
        return {
            "success": True,
            "summary": summary,
            "original_words": len(text.split()),
            "summary_words": len(summary.split()),
            "reduction": f"{round((1 - len(summary.split()) / len(text.split())) * 100)}%",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def text_to_speech(text: str, lang: str = "en") -> dict:
    try:
        print("TTS language:", lang)
        print("TTS text length:", len(text))

        if not lang:
            lang = "en"

        words = text.split()
        if len(words) > 500:
            text = " ".join(words[:500]) + "..."

        tts = gTTS(text=text, lang=lang, slow=False)

        # Windows-safe temp file handling
        tmp_path = tempfile.mktemp(suffix=".mp3")

        tts.save(tmp_path)

        with open(tmp_path, "rb") as f:
            audio_data = base64.b64encode(f.read()).decode("utf-8")

        os.remove(tmp_path)

        return {
            "success": True,
            "audio_base64": audio_data,
            "format": "mp3"
        }

    except Exception as e:
        print("TTS ERROR:", str(e))
        return {
            "success": False,
            "error": str(e)
        }