from flask import Blueprint, jsonify
from db import get_table
from datetime import datetime, timedelta
from dateutil.parser import parse
from collections import defaultdict

charts_bp = Blueprint("charts", __name__)

# 📊 Bar Chart: Mostly Sold Items (Top 10)
@charts_bp.route("/api/charts/bar", methods=["GET"])
def get_charts_bar():
    try:
        transactions = get_table("transactions").select("item_name, quantity").execute().data
        bar_data = defaultdict(int)

        for t in transactions:
            name = t.get("item_name")
            quantity = t.get("quantity", 0)
            if name:
                bar_data[name] += quantity

        # Sort by total sold (descending) and take only top 10
        sorted_data = sorted(bar_data.items(), key=lambda x: x[1], reverse=True)[:10]

        result = [{"name": k, "total_sold": v} for k, v in sorted_data]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 📈 Line Chart: Weekly Inventory Usage
@charts_bp.route("/api/charts/line/inventory", methods=["GET"])
def inventory_line_chart():
    try:
        transactions = get_table("transactions").select("transaction_date, quantity").execute().data
        weekly_usage = defaultdict(int)
        for t in transactions:
            date_str = t.get("transaction_date")
            quantity = t.get("quantity", 0)
            if date_str:
                try:
                    date = datetime.fromisoformat(date_str.replace("Z", ""))
                    week_num = date.isocalendar()[1]
                    weekly_usage[week_num] += quantity
                except:
                    continue
        result = [{"week_num": k, "total_usage": v} for k, v in sorted(weekly_usage.items())]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🍩 Donut Chart: Breakdown by Medicine per Week
@charts_bp.route("/api/charts/donut/inventory/<int:week_num>", methods=["GET"])
def inventory_donut_chart(week_num):
    try:
        transactions = get_table("transactions").select("transaction_date, item_name, quantity").execute().data
        weekly_items = defaultdict(int)
        for t in transactions:
            date_str = t.get("transaction_date")
            name = t.get("item_name")
            quantity = t.get("quantity", 0)
            if not date_str or not name:
                continue
            try:
                date = datetime.fromisoformat(date_str.replace("Z", ""))
                if date.isocalendar()[1] == week_num:
                    weekly_items[name] += quantity
            except:
                continue
        result = [{"item_name": k, "quantity": v} for k, v in sorted(weekly_items.items(), key=lambda x: x[1], reverse=True)]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 📈 Sales Line Chart: Weekly Sales Totals

@charts_bp.route("/api/charts/sales/<timeframe>", methods=["GET"])
def sales_chart_by_timeframe(timeframe):
    try:
        transactions = get_table("transactions")\
            .select("transaction_date, quantity, price, transaction_type")\
            .eq("transaction_type", "out")\
            .gte("transaction_date", (datetime.utcnow() - timedelta(days=365)).isoformat())\
            .execute().data

        print(f"[DEBUG] Retrieved {len(transactions)} transactions")

        buckets = defaultdict(float)

        for t in transactions:
            date_str = t.get("transaction_date")
            qty = int(t.get("quantity") or 0)
            price = float(t.get("price") or 0)
            if not date_str:
                continue
            try:
                date = parse(date_str)

                if timeframe == "weekly":
                    week = date.isocalendar()[1]
                    year = date.isocalendar()[0]
                    key = f"Week {week}"
                    sort_key = year * 100 + week
                elif timeframe == "monthly":
                    key = date.strftime("%b %Y")
                    sort_key = date.year * 100 + date.month
                elif timeframe == "quarterly":
                    quarter = (date.month - 1) // 3 + 1
                    key = f"Q{quarter} {date.year}"
                    sort_key = date.year * 10 + quarter
                elif timeframe == "yearly":
                    key = str(date.year)
                    sort_key = date.year
                else:
                    return jsonify({"error": "Invalid timeframe"}), 400

                buckets[(key, sort_key)] += qty * price
            except Exception as err:
                print(f"[ERROR] Failed to parse date: {date_str} → {err}")
                continue

        sorted_data = sorted(buckets.items(), key=lambda x: x[0][1])[-10:]
        result = [{"period": k, "sales": round(v, 2)} for (k, _), v in sorted_data]

        print(f"[DEBUG] Final sales chart result:", result)
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] Failed to generate sales chart: {e}")
        return jsonify({"error": str(e)}), 500
    
    
# 🧪 Debug Route: View Raw Transaction Data
@charts_bp.route("/api/debug/transactions", methods=["GET"])
def debug_transactions():
    try:
        data = get_table("transactions").select("*").limit(10).execute().data
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@charts_bp.route("/api/debug/sales", methods=["GET"])
def debug_sales_data():
    try:
        transactions = get_table("transactions").select("*").limit(10).execute().data
        return jsonify(transactions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
