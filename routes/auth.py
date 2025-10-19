from flask import Blueprint, request, jsonify, session
from db import get_table  # assuming you have a db helper

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")  # ⚠️ plain-text, consider hashing later

    # Query users table
    response = get_table("users").select("*").eq("username", username).execute()
    user = response.data[0] if response.data else None

    # Check password
    if user and user.get("password_hash") == password:
        # ✅ Store session keys that match your templates
        session["user_id"] = user["user_id"]
        session["user_name"] = user["username"]
        session["user_position"] = user.get("role", "User")
        return jsonify({
            "success": True,
            "user_name": session["user_name"],
            "user_position": session["user_position"]
        })
    else:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401
    

@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})
