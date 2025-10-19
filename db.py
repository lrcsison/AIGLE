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
    return get_table("medicines").select("medicine_id, name, quantity").execute().data or []

def get_medicine_transactions(start_date: datetime, end_date: datetime):
    """Fetch transactions within a date range."""
    return (
        get_table("transactions")
        .select("medicine_id, quantity, transaction_date, transaction_type")
        .gte("transaction_date", start_date.isoformat())
        .lte("transaction_date", end_date.isoformat())
        .execute()
        .data or []
    )

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