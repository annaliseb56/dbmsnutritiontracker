from flask import Blueprint, request, jsonify, session
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime

logged_workout_bp = Blueprint('logged_workout', __name__)

# Get all logged workouts for user
@logged_workout_bp.get("/logged-workouts")
def get_logged_workouts():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT 
                workout_id, 
                name, 
                notes, 
                duration, 
                TO_CHAR(workout_date, 'YYYY-MM-DD') as workout_date,
                total_calories_burned
            FROM workouts
            WHERE user_id = %s AND is_template = FALSE
            ORDER BY workout_date DESC
        """, (user_id,))
        
        workouts = cur.fetchall()
        return jsonify({"workouts": workouts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Get exercises for a specific logged workout
@logged_workout_bp.get("/logged-workouts/<int:workout_id>/exercises")
def get_logged_workout_exercises(workout_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Verify user owns the logged workout
        cur.execute("""
            SELECT workout_id FROM workouts
            WHERE workout_id = %s AND user_id = %s AND is_template = FALSE
        """, (workout_id, user_id))
        if not cur.fetchone():
            return jsonify({"error": "Workout not found"}), 404

        # Fetch exercises with all logged data
        cur.execute("""
            SELECT 
                e.exercise_id,
                e.exercise_type,
                e.category,
                e.calories_per_kg,
                we.sets,
                we.reps,
                we.weight,
                we.max_weight,
                we.distance,
                we.exercise_duration,
                we.incline
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.exercise_id
            WHERE we.workout_id = %s
        """, (workout_id,))
        
        exercises = cur.fetchall()
        return jsonify({"exercises": exercises})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Delete a logged workout
@logged_workout_bp.delete("/logged-workouts/<int:workout_id>")
def delete_logged_workout(workout_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Verify user owns the logged workout
        cur.execute("""
            SELECT workout_id FROM workouts
            WHERE workout_id = %s AND user_id = %s AND is_template = FALSE
        """, (workout_id, user_id))
        if not cur.fetchone():
            return jsonify({"error": "Workout not found"}), 404

        # Delete the workout (cascade will delete workout_exercises)
        cur.execute("""
            DELETE FROM workouts
            WHERE workout_id = %s
        """, (workout_id,))

        conn.commit()
        return jsonify({"success": True, "message": "Workout deleted successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Search logged workouts by name and/or date
@logged_workout_bp.get("/logged-workouts/search")
def search_logged_workouts():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    name = request.args.get("name", "").strip()
    date = request.args.get("date", "").strip()

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        query = """
            SELECT 
                workout_id, 
                name, 
                notes, 
                duration, 
                TO_CHAR(workout_date, 'YYYY-MM-DD') as workout_date,
                total_calories_burned
            FROM workouts
            WHERE user_id = %s AND is_template = FALSE
        """
        params = [user_id]

        if name:
            query += " AND name ILIKE %s"
            params.append(f"%{name}%")

        if date:
            query += " AND DATE(workout_date) = %s"
            params.append(date)

        query += " ORDER BY workout_date DESC"
        cur.execute(query, params)
        workouts = cur.fetchall()

        return jsonify({"workouts": workouts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()