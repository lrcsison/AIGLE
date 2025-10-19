from flask import Blueprint, request, jsonify
from db import get_table

suppliers_bp = Blueprint("suppliers", __name__)

# CREATE
@suppliers_bp.route("/api/suppliers", methods=["POST"])
def add_suppliers():
    data = request.json

    response = get_table("suppliers").insert({
        "name": data["name"],
        "contact_person": data.get("contact_person"),
        "contact_info": data.get("contact_info"),
        "address": data.get("address"),
        "is_active": data.get("is_active", True),
        "notes": data.get("notes")
    }).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400
    
    return jsonify({"message": "Supplier added", "data": response.data})

# READ
@suppliers_bp.route("/api/suppliers", methods=["GET"])
def get_suppliers():
    response = get_table("suppliers").select("*").execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400
    
    return jsonify(response.data)

# UPDATE
@suppliers_bp.route("/api/suppliers/<int:id>", methods=["PUT"])
def update_suppliers(id):
    data = request.json

    response = get_table("suppliers").update({
        "name": data["name"],
        "contact_person": data.get("contact_person"),
        "contact_info": data.get("contact_info"),
        "address": data.get("address"),
        "is_active": data.get("is_active"),
        "notes": data.get("notes")
    }).eq("supplier_id", id).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "Supplier updated", "data": response.data})

# DELETE
@suppliers_bp.route("/api/suppliers/<int:id>", methods=["DELETE"])
def delete_suppliers(id):
    response = get_table("suppliers").delete().eq("supplier_id", id).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400
    
    return jsonify({"message": "Supplier deleted"})
