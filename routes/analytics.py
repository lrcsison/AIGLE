from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from tabpfn import TabPFNRegressor
from db import get_historical_transactions, get_medicine_stock, get_medicine_transactions

analytics_bp = Blueprint("analytics", __name__)

class MedicineAnalytics:
    def __init__(self):
        self.model = TabPFNRegressor(device='cpu')

    def prepare_data(self, transactions_data):
        if not transactions_data:
            return pd.DataFrame()

        df = pd.DataFrame(transactions_data)
        if df.empty:
            return df

        # Parse transaction_date robustly (accept various ISO formats)
        if 'transaction_date' in df.columns:
            df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
            # drop rows where date couldn't be parsed
            df = df.dropna(subset=['transaction_date'])
            df['month'] = df['transaction_date'].dt.month
            df['year'] = df['transaction_date'].dt.year
        else:
            now = datetime.now()
            df['month'] = now.month
            df['year'] = now.year

        # Ensure quantity is numeric
        if 'quantity' in df.columns:
            df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0)

        # Normalize transaction_type and filter only 'out' (case-insensitive). If transaction_type missing, assume rows are relevant.
        if 'transaction_type' in df.columns:
            df['transaction_type'] = df['transaction_type'].astype(str).str.lower().str.strip()
            # common tokens that indicate an outgoing/usage transaction
            out_tokens = {'out', 'o', 'dispensed', 'dispense', 'sold', 'sale', 'withdrawal', 'used'}
            mask_out = df['transaction_type'].isin(out_tokens)
            if mask_out.any():
                df = df[mask_out]
            else:
                # fallback: if quantities are negative assume negative means out
                if 'quantity' in df.columns and (df['quantity'] < 0).any():
                    print("[DEBUG] prepare_data: inferring 'out' from negative quantities")
                    df.loc[df['quantity'] < 0, 'quantity'] = df.loc[df['quantity'] < 0, 'quantity'].abs()
                else:
                    # last resort: assume all rows are relevant (treat as 'out')
                    print("[DEBUG] prepare_data: no explicit 'out' type found; treating all rows as out")

        return df

    def analyze_usage(self, period='quarterly', start_date=None, end_date=None):
        if start_date is None:
            start_date = datetime.now() - timedelta(days=90)
        if end_date is None:
            end_date = datetime.now()

        print(f"[DEBUG] Fetching transactions for period {period} from {start_date} to {end_date}")
        transactions = get_medicine_transactions(start_date, end_date)
        print(f"[DEBUG] Found {len(transactions)} raw transactions")
        
        df = self.prepare_data(transactions)
        print(f"[DEBUG] After prepare_data: {len(df)} rows")

        if df.empty:
            print("[DEBUG] No transactions after filtering")
            return []

        try:
            # Get current medicine stock for names
            medicines = {m['medicine_id']: m['name'] for m in get_medicine_stock()}
            print(f"[DEBUG] Found {len(medicines)} medicines in stock")

            # For transaction types that indicate outgoing/usage
            out_indicators = {'out', 'o', 'dispensed', 'dispense', 'sold', 'sale', 'withdrawal', 'used'}
            
            # Handle transaction types more flexibly
            if 'transaction_type' in df.columns:
                df['transaction_type'] = df['transaction_type'].astype(str).str.lower().str.strip()
                # Mark transactions as outgoing if they match any out indicator
                is_out = df['transaction_type'].str.contains('|'.join(out_indicators), na=False)
                # Also consider negative quantities as outgoing
                is_negative = df['quantity'] < 0
                df['is_outgoing'] = is_out | is_negative
                # Convert negative quantities to positive for outgoing transactions
                df.loc[is_negative, 'quantity'] = df.loc[is_negative, 'quantity'].abs()
            else:
                # If no transaction type, assume all transactions are relevant
                df['is_outgoing'] = True

            # Sum quantities by medicine, considering only outgoing transactions
            usage_stats = df[df['is_outgoing']].groupby('medicine_id').agg({
                'quantity': 'sum'
            }).reset_index()
            
            print(f"[DEBUG] Generated usage stats for {len(usage_stats)} medicines")

            result = []
            for _, row in usage_stats.iterrows():
                medicine_id = row['medicine_id']
                total_usage = int(row['quantity'])  # Already ensured positive by earlier logic
                if total_usage > 0:  # Only include medicines that were actually used
                    result.append({
                        'name': medicines.get(medicine_id, f'Medicine {medicine_id}'),
                        'net_usage': total_usage
                    })

            # Sort by usage (highest to lowest)
            result.sort(key=lambda x: x['net_usage'], reverse=True)
            print(f"[DEBUG] Final result contains {len(result)} medicines")
            if result:
                print("[DEBUG] Sample result:", result[0])
            return result

        except Exception as e:
            print(f"[ERROR] analyze_usage failed: {str(e)}")
            return []

    def forecast_stock(self, medicine_id, months_ahead=3):
        transactions = get_historical_transactions()
        df = self.prepare_data(transactions)

        if df.empty:
            return {'dates': [], 'predicted_quantity': []}

        medicine_data = df[df['medicine_id'] == medicine_id].copy()
        if medicine_data.empty:
            return {'dates': [], 'predicted_quantity': []}

        try:
            X = medicine_data[['month', 'year']].values
            y = medicine_data['quantity'].values
            self.model.fit(X, y)

            last_date = df['transaction_date'].max()
            future_dates = pd.date_range(start=last_date, periods=months_ahead + 1, freq='M')[1:]
            future_X = np.array([[d.month, d.year] for d in future_dates])
            predictions = self.model.predict(future_X)

            return {
                'dates': future_dates.strftime('%Y-%m').tolist(),
                'predicted_quantity': predictions.tolist()
            }

        except Exception as e:
            print(f"[ERROR] forecast_stock failed: {str(e)}")
            return {'dates': [], 'predicted_quantity': []}

    def get_stock_recommendations(self):
        current_stock = get_medicine_stock()
        if not current_stock:
            return []

        recommendations = []

        for medicine in current_stock:
            try:
                medicine_id = medicine.get('medicine_id')
                name = medicine.get('name', f'Medicine {medicine_id}')
                current_quantity = medicine.get('quantity', 0)


                forecast = self.forecast_stock(medicine_id)
                forecast_usage = np.mean(forecast['predicted_quantity']) if forecast['predicted_quantity'] else current_quantity * 0.8

                # Explicit out-of-stock check
                if current_quantity == 0:
                    action = "Replenish stock immediately"
                    status = "Out of Stock"
                elif current_quantity > forecast_usage * 1.5:
                    action = f"Reduce by ~{int(current_quantity - forecast_usage)} units if possible"
                    status = "Overstock"
                elif current_quantity < forecast_usage * 0.8:
                    action = f"Increase by ~{int(forecast_usage - current_quantity)} units if possible"
                    status = "Understock"
                else:
                    action = "Stock level optimal"
                    status = "Adequate"

                recommendations.append({
                    'name': name,
                    'current_stock': current_quantity,
                    'forecast_usage': round(abs(forecast_usage), 2),
                    'recommendation': action,
                    'status': status
                })

            except Exception as e:
                print(f"[ERROR] Recommendation failed for {medicine_id}: {str(e)}")
                continue

        recommendations.sort(key=lambda x: x['name'])
        return recommendations

analytics = MedicineAnalytics()

@analytics_bp.route("/api/usage")
def get_usage():
    period = request.args.get("period", "quarterly")
    year = int(request.args.get("year", datetime.now().year))
    now = datetime.now()

    if period == "yearly":
        start_date = datetime(year, 1, 1)
        end_date = datetime(year + 1, 1, 1)
    elif period == "quarterly":
        quarter = request.args.get("quarter", f"Q{(now.month - 1) // 3 + 1}")
        quarter_map = {"Q1": 1, "Q2": 4, "Q3": 7, "Q4": 10}
        start_month = quarter_map.get(quarter, 7)
        if start_month <= 9:
            end_month = start_month + 3
            end_date = datetime(year, end_month, 1)
        else:
            end_date = datetime(year + 1, (start_month + 3) % 12, 1)
        start_date = datetime(year, start_month, 1)
    elif period == "monthly":
        month = int(request.args.get("month", now.month))
        start_date = datetime(year, month, 1)
        end_date = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)
    else:  # weekly
        week = int(request.args.get("week", 1))
        start_date = now - timedelta(days=week * 7)
        end_date = start_date + timedelta(days=7)

    usage_data = analytics.analyze_usage(period, start_date, end_date)
    return jsonify(usage_data)

@analytics_bp.route("/api/forecast")
def get_forecast():
    medicine_id = request.args.get("medicine_id")
    if not medicine_id:
        return jsonify({"error": "Medicine ID required"}), 400

    forecast_data = analytics.forecast_stock(int(medicine_id))
    return jsonify(forecast_data)

@analytics_bp.route("/api/recommendations")
def get_recommendations():
    recommendations = analytics.get_stock_recommendations()
    return jsonify(recommendations)
