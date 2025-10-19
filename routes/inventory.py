from flask import Blueprint, jsonify, request, make_response
from db import get_table
from datetime import datetime, timedelta

inventory_bp = Blueprint("inventory", __name__)

# -----------------------------
# Inventory summary for cards
# -----------------------------
@inventory_bp.route("/api/inventory/summary")
def inventory_summary():
    medicines = get_table("medicines").select("*").execute().data or []

    total_items = len(medicines)
    low_stock = 0
    out_of_stock = 0
    expiring_soon = 0

    for m in medicines:
        # Ensure quantity is an integer
        try:
            qty = int(m.get("quantity") or 0)
        except ValueError:
            qty = 0

        expiry = m.get("expiry_date")

        if qty == 0:
            out_of_stock += 1
        elif qty <= 10:
            low_stock += 1

        if expiry:
            try:
                expiry_dt = datetime.fromisoformat(expiry)
                if expiry_dt.date() <= (datetime.now() + timedelta(days=30)).date():
                    expiring_soon += 1
            except Exception:
                pass  # ignore invalid date formats

    return jsonify({
        "total_items": total_items,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "expiring_soon": expiring_soon
    })


# -----------------------------
# Inventory table API
# -----------------------------
@inventory_bp.route("/api/inventory", methods=["GET"])
def inventory():
    filter_type = request.args.get("type", "all")  # default: all

    query = get_table("medicines").select(
        "medicine_id, name, lot_no, storage_location, supplier_id, quantity, expiry_date"
    )

    if filter_type == "low_stock":
        query = query.gt("quantity", 0).lte("quantity", 10)
    elif filter_type == "out_of_stock":
        query = query.eq("quantity", 0)
    elif filter_type == "expired":
        query = query.lt("expiry_date", datetime.utcnow().isoformat())

    response = query.order("quantity", desc=False).execute()
    rows = response.data or []

    resp = make_response(jsonify(rows))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    resp.headers["ETag"] = ""
    return resp
