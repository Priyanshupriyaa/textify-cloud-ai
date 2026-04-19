from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.db import users_collection
from utils.auth_utils import generate_token
from bson import ObjectId
import re

auth_bp = Blueprint("auth", __name__)


def validate_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        print("[REGISTER] Request data:", request.get_json())
        data = request.get_json()
        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        print(f"[REGISTER] Validating: name={name}, email={email}, password_len={len(password)}")

        if not all([name, email, password]):
            print("[REGISTER] Error: All fields required")
            return jsonify({"error": "All fields required"}), 400
        if not validate_email(email):
            print("[REGISTER] Error: Invalid email")
            return jsonify({"error": "Invalid email"}), 400
        if len(password) < 6:
            print("[REGISTER] Error: Password too short")
            return jsonify({"error": "Password must be 6+ characters"}), 400
        
        print(f"[REGISTER] Checking duplicate email: {email}")
        existing = users_collection.find_one({"email": email})
        if existing:
            print("[REGISTER] Error: Email already registered")
            return jsonify({"error": "Email already registered"}), 409

        user = {
            "name": name,
            "email": email,
            "password": generate_password_hash(password),
            "created_at": __import__("datetime").datetime.utcnow(),
            "docs_processed": 0,
        }
        print("[REGISTER] Inserting user to DB...")
        result = users_collection.insert_one(user)
        print(f"[REGISTER] Insert result: {result.inserted_id}")
        
        token = generate_token(str(result.inserted_id))
        print("[REGISTER] Token generated, success")

        return jsonify({
            "message": "Registered successfully",
            "token": token,
            "user": {"id": str(result.inserted_id), "name": name, "email": email}
        }), 201
        
    except KeyError as e:
        print(f"[REGISTER] Missing field error: {str(e)}")
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        print(f"[REGISTER] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        print("[LOGIN] Request data:", request.get_json())
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        print(f"[LOGIN] Looking up user: {email}")
        user = users_collection.find_one({"email": email})
        if not user:
            print("[LOGIN] No user found")
            return jsonify({"error": "Invalid credentials"}), 401
        
        if "password" not in user:
            print("[LOGIN] User missing password field")
            return jsonify({"error": "Invalid user data"}), 500
        
        is_valid = check_password_hash(user["password"], password)
        print(f"[LOGIN] Password check: {is_valid}")
        if not is_valid:
            print("[LOGIN] Invalid password")
            return jsonify({"error": "Invalid credentials"}), 401

        token = generate_token(str(user["_id"]))
        print("[LOGIN] Success, token generated")
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "docs_processed": user.get("docs_processed", 0),
            }
        })
    except Exception as e:
        print(f"[LOGIN] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


@auth_bp.route("/me", methods=["GET"])
def me():
    from utils.auth_utils import token_required
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401
    try:
        import jwt, os
        data = jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms=["HS256"])
        user = users_collection.find_one({"_id": ObjectId(data["user_id"])})
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "docs_processed": user.get("docs_processed", 0),
        })
    except:
        return jsonify({"error": "Invalid token"}), 401
