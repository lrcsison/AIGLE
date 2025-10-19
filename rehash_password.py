import bcrypt
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Replace with your test user
username = "admin"
plaintext_password = "mypassword"

# Generate bcrypt hash
hashed = bcrypt.hashpw(plaintext_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Save into Supabase
supabase.table("users").update({"password_hash": hashed}).eq("username", username).execute()

print(f"Updated {username}'s password to bcrypt hash")
