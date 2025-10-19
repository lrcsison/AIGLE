from flask import Blueprint, request, jsonify
from db import get_table

users_bp = Blueprint("users", __name__)

# CREATE
@users_bp.route("/api/users", methods=["POST"])
def add_user():
    data = request.json
    response = (
        get_table("users")
        .insert(
            {
                "username": data["username"],
                "password_hash": data["password_hash"],
                "role": data["role"],
            }
        )
        .execute()
    )

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "User added", "user": response.data}), 201


# READ
@users_bp.route("/api/users", methods=["GET"])
def get_users():
    response = get_table("users").select("*").execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify(response.data)


# UPDATE
@users_bp.route("/api/users/<int:id>", methods=["PUT"])
def update_user(id):
    data = request.json
    response = (
        get_table("users")
        .update(
            {
                "username": data["username"],
                "password_hash": data["password_hash"],
                "role": data["role"],
            }
        )
        .eq("user_id", id)
        .execute()
    )

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "User updated"})


# DELETE
@users_bp.route("/api/users/<int:id>", methods=["DELETE"])
def delete_user(id):
    response = get_table("users").delete().eq("user_id", id).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "User deleted"})
