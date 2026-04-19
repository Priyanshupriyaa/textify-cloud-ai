from flask import Blueprint, request, jsonify, send_file
from utils.auth_utils import token_required
from services.ai_service import extract_text_from_image, summarize_text, text_to_speech
from services.storage import upload_file
from models.db import documents_collection, users_collection
from bson import ObjectId
import datetime
import io


document_bp = Blueprint("document", __name__)


# =========================
# PROCESS DOCUMENT ROUTE
# =========================

@document_bp.route("/process", methods=["POST"])
@token_required
def process_document():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    language = request.form.get("language", "eng")
    summary_style = request.form.get("summary_style", "concise")
    tts_lang = request.form.get("tts_lang", "en")

    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    allowed = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".pdf"}

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    if ext not in allowed:
        return jsonify({"error": "Unsupported file type"}), 400

    file_bytes = file.read()


    # STEP 1 — Upload to Cloudinary
    print("STEP 1: Uploading to Cloudinary...")
    upload_result = upload_file(file_bytes, f"{request.user_id}_{file.filename}")

    file_url = upload_result.get("url", "") if upload_result["success"] else ""


    # STEP 2 — OCR Extraction
    print("STEP 2: Running OCR...")
    ocr_result = extract_text_from_image(file_bytes, file.filename, language)

    if not ocr_result["success"]:
        return jsonify({"error": f"OCR failed: {ocr_result['error']}"}), 422

    extracted_text = ocr_result["text"]
    word_count = ocr_result["word_count"]


    # STEP 3 — Summarization
    print("STEP 3: Summarizing...")
    summary_result = summarize_text(extracted_text, summary_style)

    summary = summary_result.get("summary", "") if summary_result["success"] else ""
    reduction = summary_result.get("reduction", "N/A")


    # STEP 4 — Text-to-Speech
    print("STEP 4: Generating TTS...")
    tts_text = summary if summary else extracted_text

    tts_result = text_to_speech(tts_text, tts_lang)

    audio_base64 = tts_result.get("audio_base64", "") if tts_result["success"] else ""


    # STEP 5 — Save to MongoDB
    print("STEP 5: Saving to MongoDB...")

    doc = {
        "user_id": request.user_id,
        "filename": file.filename,
        "file_url": file_url,
        "extracted_text": extracted_text,
        "summary": summary,
        "word_count": word_count,
        "reduction": reduction,
        "ocr_language": language,   # FIXED reserved MongoDB field issue
        "summary_style": summary_style,
        "created_at": datetime.datetime.utcnow(),
    }

    result = documents_collection.insert_one(doc)


    # Update user stats
    users_collection.update_one(
        {"_id": ObjectId(request.user_id)},
        {"$inc": {"docs_processed": 1}}
    )


    return jsonify({
        "doc_id": str(result.inserted_id),
        "filename": file.filename,
        "file_url": file_url,
        "extracted_text": extracted_text,
        "summary": summary,
        "word_count": word_count,
        "reduction": reduction,
        "audio_base64": audio_base64,
    })


# =========================
# DOCUMENT HISTORY ROUTE
# =========================

@document_bp.route("/history", methods=["GET"])
@token_required
def get_history():

    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))

    skip = (page - 1) * limit

    docs = list(
        documents_collection.find(
            {"user_id": request.user_id},
            {"extracted_text": 0}
        )
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    total = documents_collection.count_documents(
        {"user_id": request.user_id}
    )

    for doc in docs:
        doc["_id"] = str(doc["_id"])

    return jsonify({
        "documents": docs,
        "total": total,
        "page": page,
        "pages": -(-total // limit),
    })


# =========================
# GET SINGLE DOCUMENT
# =========================

@document_bp.route("/<doc_id>", methods=["GET"])
@token_required
def get_document(doc_id):

    try:
        doc = documents_collection.find_one({
            "_id": ObjectId(doc_id),
            "user_id": request.user_id
        })

        if not doc:
            return jsonify({"error": "Document not found"}), 404

        doc["_id"] = str(doc["_id"])

        return jsonify(doc)

    except:
        return jsonify({"error": "Invalid document ID"}), 400


# =========================
# DELETE DOCUMENT
# =========================

@document_bp.route("/<doc_id>", methods=["DELETE"])
@token_required
def delete_document(doc_id):

    try:
        result = documents_collection.delete_one({
            "_id": ObjectId(doc_id),
            "user_id": request.user_id
        })

        if result.deleted_count == 0:
            return jsonify({"error": "Document not found"}), 404

        return jsonify({"message": "Deleted successfully"})

    except:
        return jsonify({"error": "Invalid document ID"}), 400


# =========================
# EXPORT DOCUMENT
# =========================

@document_bp.route("/export/<doc_id>", methods=["GET"])
@token_required
def export_document(doc_id):

    try:
        doc = documents_collection.find_one({
            "_id": ObjectId(doc_id),
            "user_id": request.user_id
        })

        if not doc:
            return jsonify({"error": "Document not found"}), 404

        content = f"""TEXTIFY EXPORT
==============
File: {doc['filename']}
Date: {doc['created_at'].strftime('%Y-%m-%d %H:%M')}
Words: {doc.get('word_count', 'N/A')}
Reduction: {doc.get('reduction', 'N/A')}

EXTRACTED TEXT
--------------
{doc['extracted_text']}

SUMMARY
-------
{doc.get('summary', 'No summary available')}
"""

        buf = io.BytesIO(content.encode("utf-8"))
        buf.seek(0)

        return send_file(
            buf,
            mimetype="text/plain",
            as_attachment=True,
            download_name=f"textify_{doc['filename']}.txt"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =========================
# REGENERATE TTS ROUTE
# =========================

@document_bp.route("/tts/<doc_id>", methods=["GET"])
@token_required
def get_tts(doc_id):

    tts_lang = request.args.get("lang", "en")

    use_summary = request.args.get(
        "use_summary", "true"
    ) == "true"

    try:
        doc = documents_collection.find_one({
            "_id": ObjectId(doc_id),
            "user_id": request.user_id
        })

        if not doc:
            return jsonify({"error": "Document not found"}), 404

        text = (
            doc.get("summary")
            if use_summary and doc.get("summary")
            else doc["extracted_text"]
        )

        result = text_to_speech(text, tts_lang)

        if not result["success"]:
            return jsonify({"error": result["error"]}), 500

        return jsonify({
            "audio_base64": result["audio_base64"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400
