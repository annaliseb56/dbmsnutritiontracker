from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_session import Session
import os
from config import Config
from models import db, User
from dotenv import load_dotenv

load_dotenv()


app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": os.getenv("FRONTEND_URL") or "*"}},
    supports_credentials=True,
)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

app.config["SQLALCHEMY_DATABASE_URI"] = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
                    
bcrypt = Bcrypt(app)
db.init_app(app)
with app.app_context():
    db.create_all()

# --- temporary fake data (replace with real DB later) ---
exercises = [
    {"id": 1, "name": "Bench Press", "category": "strength",
     "muscle_groups": ["chest", "triceps"]},
    {"id": 2, "name": "Squat", "category": "strength",
     "muscle_groups": ["legs", "glutes"]},
]

meals = [
    {"id": 1, "name": "Grilled Chicken", "calories": 350, "protein_g": 30},
    {"id": 2, "name": "Oatmeal", "calories": 250, "protein_g": 10},
]


@app.route("/")
def root():
    return "Flask backend is running. Try /api/health, /api/exercises, or /api/meals."

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON payload"}), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing fields"}), 400

    # Later you'll add real DB validation here
    session["user"] = username  

    return jsonify({"message": "Logged in!", "user": username})

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Flask backend is running"})


@app.route("/api/exercises")
def get_exercises():
    return jsonify(exercises)


@app.route("/api/meals")
def get_meals():
    return jsonify(meals)


if __name__ == "__main__":
    # Flask default host is 127.0.0.1 and port 5000
    app.run(debug=True, port=5000)
