from flask import Blueprint, request, jsonify
from db import get_table

medicines_bp = Blueprint("medicines", __name__)

# CREATE
@medicines_bp.route("/api/medicines", methods=["POST"])
def add_medicine():
    data = request.json

    response = get_table("medicines").insert({
        "name": data["name"],
        "description": data["description"],
        "expiry_date": data["expiry_date"],
        "quantity": data["quantity"],
        "price": data["price"],
        "unit": data["unit"],
        "lot_no": data["lot_no"],
        "storage_location": data["storage_location"],
        "manufacturer_id": data["manufacturer_id"],
        "supplier_id": data["supplier_id"]
    }).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "Medicine added", "data": response.data})

# READ
@medicines_bp.route("/api/medicines", methods=["GET"])
def get_medicines():
    response = get_table("medicines").select("*").execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify(response.data)

# UPDATE
@medicines_bp.route("/api/medicines/<int:id>", methods=["PUT"])
def update_medicine(id):
    data = request.json

    response = get_table("medicines").update({
        "name": data["name"],
        "description": data["description"],
        "expiry_date": data["expiry_date"],
        "quantity": data["quantity"],
        "price": data["price"],
        "unit": data["unit"],
        "lot_no": data["lot_no"],
        "storage_location": data["storage_location"],
        "manufacturer_id": data["manufacturer_id"],
        "supplier_id": data["supplier_id"]
    }).eq("medicine_id", id).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "Medicine updated", "data": response.data})

# DELETE
@medicines_bp.route("/api/medicines/<int:id>", methods=["DELETE"])
def delete_medicine(id):
    response = get_table("medicines").delete().eq("medicine_id", id).execute()

    if response.error:
        return jsonify({"error": response.error.message}), 400

    return jsonify({"message": "Medicine deleted"})
