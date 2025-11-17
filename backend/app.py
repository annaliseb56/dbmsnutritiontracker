from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow requests from the React frontend

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
