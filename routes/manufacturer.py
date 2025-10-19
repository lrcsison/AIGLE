from flask import Blueprint, request, jsonify
from db import get_table

manufacturer_bp = Blueprint("manufacturer", __name__)

# CREATE
@manufacturer_bp.route("/api/manufacturer", methods=["POST"])
def add_manufacturer():
    data = request.json

    response = get_table("manufacturer").insert({
        "name": data["name"],
        "contact_info": data["contact_info"],
        "address": data["address"],
        "country": data["country"],
        "notes": data.get("notes", "")
    }).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "Manufacturer added", "data": response.data})

# READ
@manufacturer_bp.route("/api/manufacturer", methods=["GET"])
def get_manufacturer():
    response = get_table("manufacturer").select("*").execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify(response.data)

# UPDATE
@manufacturer_bp.route("/api/manufacturer/<int:id>", methods=["PUT"])
def update_manufacturer(id):
    data = request.json

    response = get_table("manufacturer").update({
        "name": data["name"],
        "contact_info": data["contact_info"],
        "address": data["address"],
        "country": data["country"],
        "notes": data.get("notes", "")
    }).eq("manufacturer_id", id).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "Manufacturer updated", "data": response.data})

# DELETE
@manufacturer_bp.route("/api/manufacturer/<int:id>", methods=["DELETE"])
def delete_manufacturer(id):
    response = get_table("manufacturer").delete().eq("manufacturer_id", id).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "Manufacturer deleted"})
