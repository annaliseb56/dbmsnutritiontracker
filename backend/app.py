from flask import Flask
from flask_cors import CORS
from routes import auth, account_bp, meal_bp, workout_bp, exercise_bp, logged_workout_bp, goal_bp, friend_bp, track_bp  
import os
from dotenv import load_dotenv
from config import Config
from flask_session import Session

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Session(app)
    CORS(app, supports_credentials=True, origins = os.getenv("FRONTEND_URL"))

    # Register Blueprints
    app.register_blueprint(auth)
    app.register_blueprint(account_bp)
    app.register_blueprint(meal_bp)
    app.register_blueprint(workout_bp)
    app.register_blueprint(exercise_bp)
    app.register_blueprint(logged_workout_bp)
    app.register_blueprint(goal_bp)
    app.register_blueprint(friend_bp)
    app.register_blueprint(track_bp)
    
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
    