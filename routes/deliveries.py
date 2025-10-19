from flask import Blueprint, jsonify
from db import get_table
import pandas as pd

deliveries_bp = Blueprint("deliveries", __name__)

@deliveries_bp.route("/api/deliveries", methods=["GET"])
def get_deliveries():
    # Fetch deliveries
    deliveries = (
        get_table("deliveries")
        .select("delivery_id, status, quantity, supplier_id, medicine_id, est_delivery, created_at")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    ).data or []

    if not deliveries:
        return jsonify([])

    # Fetch suppliers + medicines
    suppliers = get_table("suppliers").select("supplier_id, name").execute().data or []
    medicines = get_table("medicines").select("medicine_id, name").execute().data or []

    df_del = pd.DataFrame(deliveries)
    df_sup = pd.DataFrame(suppliers)
    df_med = pd.DataFrame(medicines)

    # Merge with suppliers
    df = df_del.merge(df_sup, on="supplier_id", how="left", suffixes=("", "_supplier"))
    df.rename(columns={"name": "supplier"}, inplace=True)

    # Merge with medicines
    df = df.merge(df_med, on="medicine_id", how="left", suffixes=("", "_medicine"))
    df.rename(columns={"name": "product"}, inplace=True)

    # Select final columns
    result = df[["delivery_id", "status", "quantity", "supplier", "product", "est_delivery"]]

    return jsonify(result.to_dict(orient="records"))
