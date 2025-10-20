from flask import Blueprint, request, jsonify, make_response
from db import get_table

transactions_bp = Blueprint("transactions", __name__)

@transactions_bp.route("/api/transactions", methods=["GET"])
def get_transactions():
    filter_type = request.args.get("type", "all")  # in/out/adjustment/all
    limit = request.args.get("limit", type=int)

    query = get_table("transactions").select("*").order("transaction_date", desc=True)

    if filter_type != "all":
        query = query.eq("transaction_type", filter_type)

    if limit:
        query = query.limit(limit)

    response = query.execute()
    rows = response.data or []

    # Format rows
    results = []
    for t in rows:
        results.append({
            "transaction_id": t.get("transaction_id"),
            "transaction_type": t.get("transaction_type"),
            "item_name": t.get("item_name"),
            "quantity": t.get("quantity"),
            "remarks": t.get("remarks"),
            "transaction_date": t.get("transaction_date"),
            "medicine_id": t.get("medicine_id"),
            "employee_id": t.get("employee_id"),
            "synced": t.get("synced")
        })

    resp = make_response(jsonify(results))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    resp.headers["ETag"] = ""
    return resp
