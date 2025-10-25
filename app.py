from flask import Flask, render_template, session, redirect, url_for, request
from functools import wraps
from flask_cors import CORS
from dotenv import load_dotenv
import os
from db import get_table  # your existing db helper

# --- Load environment variables ---
load_dotenv()

# --- Create Flask app ---
app = Flask(__name__, template_folder="template")
CORS(app)
app.secret_key = os.getenv("SECRET_KEY", "super-secret-key")

# --- Import blueprints AFTER app is defined ---
from routes import auth_bp, inventory_bp, transactions_bp, charts_bp
from routes.employees import employees_bp
from routes.top_sales import top_sales_bp
from routes.deliveries import deliveries_bp
from routes.medicines import medicines_bp
from routes.analytics import analytics_bp

# --- Register blueprints ---
app.register_blueprint(auth_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(charts_bp)
app.register_blueprint(top_sales_bp)
app.register_blueprint(deliveries_bp)
app.register_blueprint(medicines_bp)
app.register_blueprint(analytics_bp)

# --- Login required decorator ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated_function


# --- Restrict non-admin users to a small set of pages ---
@app.before_request
def restrict_non_admin_pages():
    # allow unauthenticated flows (login, static files, api, etc.)
    path = request.path or ""
    # always allow static and api resources and auth endpoints
    if path.startswith("/static") or path.startswith("/api"):
        return None

    # endpoints that non-admin users are allowed to visit
    allowed_for_non_admin = {"/", "/login", "/logout", "/dashboard", "/inventory", "/transactions"}

    # if user not logged in, let other decorators/routes handle redirects
    if "user_id" not in session:
        return None

    role = session.get("user_position", "User")
    # if user is admin, allow everything
    if str(role).lower() == "admin":
        return None

    # if non-admin and requesting a disallowed path, redirect to dashboard
    if path not in allowed_for_non_admin:
        return redirect(url_for("dashboard"))

    return None

# --- Routes ---
@app.route("/")
def root():
    return redirect(url_for("login_page"))

@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        response = get_table("users").select("*").eq("username", username).execute()
        user = response.data[0] if response.data else None

        if user and user["password_hash"] == password:
            # store session info
            session["user_id"] = user["user_id"]
            session["user_name"] = user["username"]
            session["user_position"] = user.get("role", "User")
            return redirect(url_for("dashboard"))
        else:
            return render_template("login.html", error="Invalid username or password")

    session.clear()
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

@app.route("/dashboard")
@login_required
def dashboard():
    print("Session:", dict(session))  # ✅ Debug line to inspect session contents
    return render_template("index.html")

@app.route("/inventory")
@login_required
def inventory():
    return render_template("inventory.html")

@app.route("/transactions")
@login_required
def transactions():
    return render_template("transactions.html")

@app.route("/analytics")
@login_required
def analytics():
    return render_template("analytics.html")

@app.route("/employees")
@login_required
def employees():
    return render_template("employees.html")

@app.route("/deliveries")
@login_required
def deliveries():
    return render_template("deliveries.html")

@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html")

@app.route("/settings")
@login_required
def settings():
    return render_template("settings.html")

@app.route("/help")
@login_required
def help_page():
    return render_template("help.html")


@app.route("/faq")
def faq_page():
    # public FAQ page — no login required
    return render_template("faq.html")

if __name__ == "__main__" and os.environ.get("FLASK_ENV") == "development":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)

if __name__ == "__main__": 
    app.run(debug=True, port=5050)
