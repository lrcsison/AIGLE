from db import get_db_connection
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_test_users():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Remove existing test users if they exist
    cursor.execute("DELETE FROM users WHERE username IN (%s, %s)", ("admin1", "staff1"))

    # Define test users
    users = [
        {
            "user_id": 1,
            "username": "admin1",
            "password": "hash123",   # plain password to hash
            "role": "admin",
            "last_login": None,      # or datetime.now() if you want timestamp
            "employee_id": 1,
        },
        {
            "user_id": 2,
            "username": "staff1",
            "password": "staff123",
            "role": "staff",
            "last_login": None,
            "employee_id": 2,
        },
    ]

    for u in users:
        cursor.execute(
            """
            INSERT INTO users (user_id, username, password_hash, role, last_login, employee_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                u["user_id"],
                u["username"],
                generate_password_hash(u["password"]),
                u["role"],
                u["last_login"],
                u["employee_id"],
            ),
        )
        print(f"✅ Created {u['username']} (password: {u['password']}, role: {u['role']})")

    conn.commit()
    conn.close()
    print("🎉 Test users created successfully!")

if __name__ == "__main__":
    create_test_users()
