from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime


# Load environment variables from .env file
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xqcvwnimuldnehgciivo.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxY3Z3bmltdWxkbmVoZ2NpaXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0ODg5NCwiZXhwIjoyMDcxNzI0ODk0fQ.yPAQdjX7dNKaoe6AzVqh6YGCJxj0OSULO9q45lm6Gjg")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test the connection and check transactions
print("[DEBUG DB] Testing Supabase connection and checking transactions...")
try:
    # Get all transactions to see what we have
    test_query = supabase.table("transactions").select("*").execute()
    print("[DEBUG DB] Supabase connection successful")
    print(f"[DEBUG DB] Total transactions found: {len(test_query.data)}")
    if test_query.data:
        types = set(str(t.get('transaction_type', '')).lower().strip() for t in test_query.data)
        print(f"[DEBUG DB] Transaction types in database: {types}")
        print(f"[DEBUG DB] Sample transaction: {test_query.data[0]}")
except Exception as e:
    print(f"[ERROR DB] Supabase connection or query failed: {str(e)}")

# Optional: wrapper functions for convenience
def get_table(table_name: str):
    """Return a Supabase table object for queries."""
    return supabase.table(table_name)


def get_db_connection():
    raise NotImplementedError(
        "get_db_connection is no longer supported. Use supabase instead."
    )

# -------------------------
# Specific wrappers
# -------------------------
def get_medicine_stock():
    """Fetch all medicine stock data."""
    try:
        result = get_table("medicines").select("medicine_id, name, quantity").execute()
        print(f"\n[DEBUG DB] Medicine stock query result: {result.data[:3] if result.data else 'No data'}")
        return result.data or []
    except Exception as e:
        print(f"[ERROR DB] Failed to get medicine stock: {str(e)}")
        raise

def get_medicine_transactions(start_date: datetime, end_date: datetime):
    """Fetch transactions within a date range."""
    try:
        # First get all medicines for name matching
        medicines_result = get_table("medicines").select("medicine_id, name").execute()
        medicine_map = {m['name']: m['medicine_id'] for m in medicines_result.data} if medicines_result.data else {}
        
        # Get transactions in the date range
        query = (
            get_table("transactions")
            .select("medicine_id, quantity, transaction_date, transaction_type, item_name")
            .gte("transaction_date", start_date.isoformat())
            .lte("transaction_date", end_date.isoformat())
        )
        result = query.execute()
        print(f"[DEBUG DB] Found {len(result.data)} transactions total")
        if result.data:
            print("[DEBUG DB] Transaction types found:", [t.get('transaction_type', 'NONE') for t in result.data[:10]])
            print("[DEBUG DB] Sample transaction:", result.data[0])
        
        # Process transactions
        filtered_data = []
        for t in result.data:
            try:
                trans_type = str(t.get('transaction_type', '')).lower().strip()
                if trans_type != 'out':
                    continue

                # Get medicine ID - either directly or from item name
                med_id = t.get('medicine_id')
                if med_id is None:
                    item_name = t.get('item_name')
                    if item_name in medicine_map:
                        med_id = medicine_map[item_name]

                # Skip if we can't identify the medicine
                if med_id is None:
                    continue

                # Get quantity and ensure it's positive
                try:
                    quantity = float(t.get('quantity', 0))
                    if quantity <= 0:
                        continue
                except (ValueError, TypeError):
                    continue

                # Add valid transaction to filtered list
                filtered_data.append({
                    'medicine_id': med_id,
                    'quantity': quantity,
                    'transaction_date': t.get('transaction_date'),
                    'item_name': t.get('item_name')
                })
            except Exception as e:
                continue

        return filtered_data
    except Exception as e:
        print(f"[ERROR DB] Failed to get transactions: {str(e)}")
        print(f"[ERROR DB] Exception details: {getattr(e, '__dict__', {})}")
        raise

def get_historical_transactions():
    """Fetch all historical transactions."""
    return (
        get_table("transactions")
        .select("medicine_id, quantity, transaction_date, transaction_type")
        .execute()
        .data or []
    )

# -------------------------
# Deprecated fallback
# -------------------------
def get_db_connection():
    raise NotImplementedError(
        "get_db_connection is deprecated. Use Supabase via get_table()."
    )