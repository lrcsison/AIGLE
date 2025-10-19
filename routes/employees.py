from flask import Blueprint, request, jsonify
from db import get_table

employees_bp = Blueprint("employees", __name__)

# READ
@employees_bp.route("/api/employees", methods=["GET"])
def get_employees():
    status = request.args.get("status")  # optional
    limit = request.args.get("limit", type=int)

    query = get_table("employees").select("*")

    if status == "active":
        query = query.eq("is_active", True)
    elif status == "inactive":
        query = query.eq("is_active", False)

    if limit:
        query = query.limit(limit)

    response = query.execute()
    data = response.data or []

    # Add full name
    for emp in data:
        emp["name"] = f"{emp.get('fname','')} {emp.get('lname','')}".strip()

    return jsonify(data)
