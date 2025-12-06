from flask import Blueprint, request, jsonify, session
from utils.db import get_connection
import datetime
from psycopg2.extras import RealDictCursor

workout_bp = Blueprint('workout', __name__)

@workout_bp.get("/workouts")
def get_workouts():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    search = request.args.get("search", "").strip()

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if search:
            cur.execute("""
                SELECT workout_id, name, notes, duration
                FROM workouts
                WHERE user_id = %s AND is_template = TRUE AND name ILIKE %s
                ORDER BY name
            """, (user_id, f"%{search}%"))
        else:
            cur.execute("""
                SELECT workout_id, name, notes, duration
                FROM workouts
                WHERE user_id = %s AND is_template = TRUE
                ORDER BY name
            """, (user_id,))

        workouts = cur.fetchall()
        return jsonify({"workouts": workouts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


#Create workout and put in DB
@workout_bp.post("/workouts")
def create_workout_template():
    # Validate User
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Get data from frontend
    data = request.get_json()
    name = data.get("name", "").strip()
    notes = data.get("notes", "").strip()
    exercises = data.get("exercises", [])

    if not name:
        return jsonify({"error": "Workout name is required"}), 400

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Insert workout template
        cur.execute("""
            INSERT INTO workouts (user_id, name, notes, duration, is_template)
            VALUES (%s, %s, %s, %s, TRUE)
            RETURNING workout_id, name, notes;
        """, (user_id, name, notes, 0))

        workout = cur.fetchone()
        workout_id = workout["workout_id"]

        # Insert selected exercises
        for ex in exercises:
            exercise_id = ex.get("exercise_id")
            exercise_duration = ex.get("exercise_duration", 0)
            if exercise_id:
                cur.execute("""
                    INSERT INTO workout_exercises (workout_id, exercise_id, exercise_duration)
                    VALUES (%s, %s, %s)
                """, (workout_id, exercise_id, exercise_duration))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Workout template created successfully!",
            "workout": workout
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

#Edit Workout templates 
@workout_bp.put("/workouts/<int:template_id>")
def update_workout_template(template_id):
    #VERIFY user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    #Get Data
    data = request.get_json() or {}
    name = data.get("name")
    notes = data.get("notes")
    add_exercises = data.get("add_exercises", [])
    remove_exercises = data.get("remove_exercises", [])

    #Connect to DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Verify workout template (is_template = TRUE)
        cur.execute("""
            SELECT workout_id FROM workouts
            WHERE workout_id = %s AND user_id = %s AND is_template = TRUE
        """, (template_id, user_id))
        if not cur.fetchone():
            return jsonify({"error": "Workout template not found"}), 404

        # Update name and notes only if provided
        if name is not None or notes is not None:
            cur.execute("""
                UPDATE workouts
                SET name = COALESCE(%s, name),
                    notes = COALESCE(%s, notes)
                WHERE workout_id = %s
            """, (name, notes, template_id))

        # Remove exercises
        if remove_exercises:
            cur.execute("""
                DELETE FROM workout_exercises
                WHERE workout_id = %s AND exercise_id = ANY(%s)
            """, (template_id, remove_exercises))

        # Add new exercises
        for ex in add_exercises:
            exercise_id = ex.get("exercise_id")
            exercise_duration = ex.get("exercise_duration", 0)
            if not exercise_id:
                continue

            # Prevent duplicates
            cur.execute("""
                SELECT 1 FROM workout_exercises
                WHERE workout_id = %s AND exercise_id = %s
            """, (template_id, exercise_id))
            if cur.fetchone():
                continue
            #Insert exercises
            cur.execute("""
                INSERT INTO workout_exercises (workout_id, exercise_id, exercise_duration)
                VALUES (%s, %s, %s)
            """, (template_id, exercise_id, exercise_duration))
        #Commit
        conn.commit()
        return jsonify({"success": True, "message": "Workout template updated"})
    #if error rollback
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        #disconnect form DB
        cur.close()
        conn.close()

#delete workout template
@workout_bp.delete("/workouts/<int:template_id>")
def delete_workout_template(template_id):
    #Validate User
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    #Connect to DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Verify user owns existing template
        cur.execute("""
            SELECT workout_id FROM workouts
            WHERE workout_id = %s AND user_id = %s AND is_template = TRUE
        """, (template_id, user_id))
        if not cur.fetchone():
            return jsonify({"error": "Workout template not found"}), 404

        # Delete workout template
        cur.execute("""
            DELETE FROM workouts
            WHERE workout_id = %s
        """, (template_id,))

        #Commit the changes
        conn.commit()
        return jsonify({"success": True, "message": "Workout template deleted"})
    #If error rollback
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        #Disconnect from DB
        cur.close()
        conn.close()

@workout_bp.get("/workouts/<int:workout_id>/exercises")
def get_workout_exercises(workout_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Verify ownership - check both template and logged workouts
        cur.execute("""
            SELECT workout_id, is_template FROM workouts
            WHERE workout_id = %s AND user_id = %s
        """, (workout_id, user_id))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Workout not found"}), 404

        # Fetch exercises
        cur.execute("""
            SELECT e.exercise_id, e.exercise_type, e.category, we.exercise_duration, 
                   we.sets, we.reps, we.weight, we.distance
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


# Log a workout (create logged workout)
@workout_bp.post("/workouts/log")
def log_workout():
    #validate the user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    #Get user's inputed data
    data = request.get_json() or {}
    template_id = data.get("template_id")
    name = data.get("name", "").strip()
    notes = data.get("notes", "").strip()
    workout_date = data.get("workout_date")  # YYYY-MM-DD
    exercises = data.get("exercises", [])

    #check required fields
    if not template_id or not name or not workout_date:
        return jsonify({"error": "Template, name, and date are required"}), 400

    #connect to DB
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get user's most recent weight from progress_tracking
        cur.execute("""
            SELECT weight FROM progress_tracking
            WHERE user_id = %s
            ORDER BY recorded_date DESC
            LIMIT 1
        """, (user_id,))
        weight_row = cur.fetchone()
        user_weight = float(weight_row["weight"]) if weight_row else 150  # default 150 lbs if not found

        # Insert workout
        cur.execute(
            """
            INSERT INTO workouts (user_id, name, notes, duration, workout_date, is_template)
            VALUES (%s, %s, %s, %s, %s, FALSE)
            RETURNING workout_id;
            """,
            (user_id, name, notes, 0, workout_date),
        )
        workout_id = cur.fetchone()["workout_id"]

        total_calories = 0.0
        total_duration = 0

        
        for ex in exercises:
            exercise_id = ex.get("exercise_id")
            sets = ex.get("sets")
            reps = ex.get("reps")
            weight = ex.get("weight")
            max_weight = ex.get("max_weight")
            distance = ex.get("distance")
            duration = ex.get("duration", 0)
            intensity = float(ex.get("intensity", 1.0))

            # Get exercise details
            cur.execute(
                "SELECT calories_per_kg, category FROM exercises WHERE exercise_id = %s",
                (exercise_id,),
            )
            ex_row = cur.fetchone()
            if not ex_row:
                continue
            calories_per_kg = float(ex_row["calories_per_kg"])
            category = ex_row["category"].upper()
            is_cardio = category == "CARDIO"

            # Calculate calories
            calories_burned = 0
            if is_cardio:
                if distance and duration:
                    # Cardio: Uses MET equation (a simplified version of it)
                    duration_hours = float(duration) / 60
                    
                    calories_burned = duration_hours * (calories_per_kg * intensity) * (user_weight / 0.453592) / 5
            else:
                if sets and reps and weight:
                    # Strength: (use MET equation but have sets and reps be a factor with the hope that they got atleast 3 set and 6 reps per set)
                    calories_burned = ((calories_per_kg * intensity) * user_weight * (float(sets) * float(reps) / 18)) / 100

            total_calories += calories_burned
            total_duration += float(duration)

            # Insert into workout_exercises
            cur.execute(
                """
                INSERT INTO workout_exercises
                (workout_id, exercise_id, exercise_duration, sets, reps, weight, max_weight, distance)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    workout_id,
                    exercise_id,
                    duration,
                    sets,
                    reps,
                    weight,
                    max_weight,
                    distance,
                ),
            )
        
        # Update total duration and total calories burned in workouts
        cur.execute(
            "UPDATE workouts SET duration=%s, total_calories_burned=%s WHERE workout_id=%s",
            (int(total_duration), total_calories, workout_id),
        )
        
        #Commit
        conn.commit()
        return jsonify({"success": True, "workout_id": workout_id, "total_calories": total_calories})
    #if error rollback
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        #Close DB connection
        cur.close()
        conn.close()