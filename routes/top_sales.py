from flask import Blueprint, jsonify
from db import get_table

top_sales_bp = Blueprint("top_sales", __name__)

@top_sales_bp.route("/api/debug/top-sales", methods=["GET"])
def debug_top_sales():
    try:
        data = get_table("transactions").select("*").limit(10).execute().data
        print("[DEBUG] Sample transactions:", data)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@top_sales_bp.route("/api/top-sales", methods=["GET"])
def get_top_sales():
    try:
        transactions = get_table("transactions")\
            .select("item_name, quantity, price")\
            .execute().data

        print(f"[DEBUG] Retrieved {len(transactions)} transactions")

        sales = {}

        for t in transactions:
            name = t.get("item_name")
            qty = int(t.get("quantity") or 0)
            price = float(t.get("price") or 0)  # ✅ use "price" here

            if name:
                if name not in sales:
                    sales[name] = {"total_units_sold": 0, "total_revenue": 0.0}
                sales[name]["total_units_sold"] += qty
                sales[name]["total_revenue"] += qty * price

        sorted_sales = sorted(sales.items(), key=lambda x: x[1]["total_units_sold"], reverse=True)[:10]
        result = [
            {
                "item_name": name,
                "total_units_sold": data["total_units_sold"],
                "total_revenue": round(data["total_revenue"], 2)
            }
            for name, data in sorted_sales
        ]

        print("[DEBUG] Final top sales result:", result)
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] Failed to generate top sales: {e}")
        return jsonify({"error": str(e)}), 500
