from db import get_db_connection
from werkzeug.security import generate_password_hash

def rehash_passwords():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get all users with current plain text passwords
    cursor.execute("SELECT user_id, password_hash FROM users")
    users = cursor.fetchall()

    for user in users:
        user_id = user["user_id"]
        plain_pw = user["password_hash"]

        # Generate a proper hash
        hashed_pw = generate_password_hash(plain_pw)

        # Update the DB with the new hash
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            (hashed_pw, user_id)
        )

        print(f"✅ Updated user_id {user_id}")

    conn.commit()
    conn.close()
    print("🎉 All passwords re-hashed securely!")

if __name__ == "__main__":
    rehash_passwords()
