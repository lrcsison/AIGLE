from flask import Blueprint, request, jsonify
from db import get_table

alerts_bp = Blueprint("alerts", __name__)

# CREATE
@alerts_bp.route("/api/alerts", methods=["POST"])
def add_alerts():
    data = request.json
    response = get_table("alerts").insert({
        "alert_type": data["alert_type"],
        "threshold": data["threshold"],
        "status": data["status"],
        "quantity": data["quantity"],
        "remarks": data["remarks"],
    }).execute()

    if response.data:
        return jsonify({"message": "Alert added", "alert": response.data[0]})
    return jsonify({"message": "Failed to add alert"}), 400


# READ
@alerts_bp.route("/api/alerts", methods=["GET"])
def get_alerts():
    response = get_table("alerts").select("*").execute()
    return jsonify(response.data)


# UPDATE
@alerts_bp.route("/api/alerts/<int:id>", methods=["PUT"])
def update_alerts(id):
    data = request.json
    response = get_table("alerts").update({
        "alert_type": data["alert_type"],
        "threshold": data["threshold"],
        "status": data["status"],
    }).eq("alerts_id", id).execute()

    if response.data:
        return jsonify({"message": "Alert updated", "alert": response.data[0]})
    return jsonify({"message": "Alert not found"}), 404


# DELETE
@alerts_bp.route("/api/alerts/<int:id>", methods=["DELETE"])
def delete_alerts(id):
    response = get_table("alerts").delete().eq("alerts_id", id).execute()

    if response.data:
        return jsonify({"message": "Alert deleted"})
    return jsonify({"message": "Alert not found"}), 404
