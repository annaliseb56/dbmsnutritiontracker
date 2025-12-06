from flask import Blueprint, jsonify, request, session
from utils.db import get_connection
import datetime
from psycopg2.extras import RealDictCursor
from utils.check_input import validate_nickname, validate_dob, validate_height, validate_weight


#Create blueprint for Account routes
account_bp = Blueprint('account', __name__)

#Get logged in users account info
@account_bp.route('/account', methods=['GET'])
def get_account():
    #Get the user_id from the flask session
    user_id = session.get('user_id')

    #Verify User
    if not user_id:
        return jsonify({"error": "KICKED OUT: NOT LOGGED IN"}), 401

    try:
        #connect to DB
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        #Fetch the user's info and their progress updates from the user table and the progress_tracking table
        cur.execute("""
            SELECT u.username, u.nickname, u.date_of_birth, pt.height, pt.weight, pt.recorded_date
            FROM users u
            LEFT JOIN progress_tracking pt ON pt.user_id = u.user_id
            WHERE u.user_id = %s
            ORDER BY pt.recorded_date DESC NULLS LAST
            LIMIT 1;
        """, (user_id,))
        
        #Get the first row
        data = cur.fetchone()
        if not data:
            # User exists but no progress_tracking row
            cur.execute("SELECT username, nickname, date_of_birth FROM users WHERE user_id=%s", (user_id,))
            user_only = cur.fetchone()
            cur.close()
            conn.close()
            return jsonify({
                "username": user_only["username"],
                "nickname": user_only["nickname"],
                "date_of_birth": user_only["date_of_birth"].isoformat() if user_only["date_of_birth"] else None,
                "height": None,
                "weight": None,
                "recorded_date": None
            }), 200

        #Return user with their progress
        return jsonify({
            "username": data["username"],
            "nickname": data["nickname"],
            "date_of_birth": data["date_of_birth"].isoformat() if data["date_of_birth"] else None,
            "height": data["height"],
            "weight": data["weight"],
            "recorded_date": data["recorded_date"].isoformat() if data["recorded_date"] else None
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        #Disoncect from DB
        cur.close()
        conn.close()

#Get user stats (streak, meals logged, workouts logged, completed goals)
@account_bp.route('/account/stats', methods=['GET'])
def get_account_stats():
    #Get the user_id from the flask session
    user_id = session.get('user_id')

    #Verify User
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    try:
        #Connect to DB
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        today = datetime.date.today()

        # Get login streak - count consecutive days from today going backwards
        cur.execute("""
            WITH RECURSIVE streak_calc AS (
                -- Base case: start from today
                SELECT CURRENT_DATE::date as check_date, 1 as streak_count
                WHERE EXISTS (
                    SELECT 1 FROM meals 
                    WHERE user_id = %s AND meal_date = CURRENT_DATE
                )
                UNION ALL
                -- Recursive case: go back one day at a time
                SELECT (check_date - INTERVAL '1 day')::date, streak_count + 1
                FROM streak_calc
                WHERE EXISTS (
                    SELECT 1 FROM meals 
                    WHERE user_id = %s AND meal_date = (check_date - INTERVAL '1 day')::date
                )
                AND streak_count < 365
            )
            SELECT COALESCE(MAX(streak_count), 0) as streak FROM streak_calc;
        """, (user_id, user_id))
        
        streak_result = cur.fetchone()
        streak = streak_result['streak'] if streak_result else 0

        # Check if meal was logged today
        cur.execute("""
            SELECT COUNT(*) > 0 as logged
            FROM meals
            WHERE user_id = %s AND meal_date = %s;
        """, (user_id, today))
        
        meal_result = cur.fetchone()
        meal_logged_today = meal_result['logged'] if meal_result else False

        # Check if workout was logged today
        cur.execute("""
            SELECT COUNT(*) > 0 as logged
            FROM workouts
            WHERE user_id = %s AND DATE(workout_date) = %s;
        """, (user_id, today))
        
        workout_result = cur.fetchone()
        workout_logged_today = workout_result['logged'] if workout_result else False

        # Get completed goals count
        cur.execute("""
            SELECT COUNT(*) as completed
            FROM goals
            WHERE user_id = %s AND goal_complete = true;
        """, (user_id,))
        
        goals_result = cur.fetchone()
        completed_goals = goals_result['completed'] if goals_result else 0

        cur.close()
        conn.close()

        return jsonify({
            "streak": streak,
            "mealLoggedToday": meal_logged_today,
            "workoutLoggedToday": workout_logged_today,
            "completedGoals": completed_goals
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

#Update user account
@account_bp.route("/account/update", methods=["POST"])
def update_account():
    #Validate the user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    #Get info from JSON
    data = request.json
    nickname = data.get("nickname")
    dob = data.get("date_of_birth")
    new_height = data.get("height")
    new_weight = data.get("weight")

    if nickname is not None:
        is_valid, error = validate_nickname(nickname)
        if not is_valid:
            return jsonify({"error": error}), 400

    dob_date = None
    if dob:
        is_valid, error, dob_date = validate_dob(dob)  # assuming your validate_dob returns date object
        if not is_valid:
            return jsonify({"error": error}), 400

    # Validate new_height
    if new_height is not None:
        is_valid, error = validate_height(new_height)
        if not is_valid:
            return jsonify({"error": error}), 400

    # Validate new_weight
    if new_weight is not None:
        is_valid, error = validate_weight(new_weight)
        if not is_valid:
            return jsonify({"error": error}), 400

    #Connect to DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Get last progress
        cur.execute("""
            SELECT height, weight
            FROM progress_tracking
            WHERE user_id = %s
            ORDER BY recorded_date DESC
            LIMIT 1;
        """, (user_id,))
        last_recorded_progress = cur.fetchone()
        has_existing_progress = last_recorded_progress is not None
        insert_progress = False
        
        #Want Height and Weight on first entry
        if not has_existing_progress:
            if new_height is None or new_weight is None:
                return jsonify({"error": "Height and weight are required on first entry"}), 400
        else: #Otherwise we insert progress
            if new_height is not None and new_weight is not None:
                insert_progress = True
                last_height, last_weight = last_recorded_progress
                if new_height is None:
                    new_height = last_height
                if new_weight is None:
                    new_weight = last_weight

        # Update user info
        if nickname is not None or dob_date is not None:
            cur.execute("""
                UPDATE users
                SET nickname = COALESCE(%s, nickname),
                    date_of_birth = COALESCE(%s, date_of_birth)
                WHERE user_id = %s;
            """, (nickname, dob_date, user_id))

        # Insert new progress row if needed
        if not has_existing_progress or insert_progress:
            cur.execute("""
                INSERT INTO progress_tracking (user_id, height, weight, recorded_date)
                VALUES (%s, %s, %s, NOW());
            """, (user_id, new_height, new_weight))

        #Commit changes
        conn.commit()
        return jsonify({"message": "Account updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        #Disconnect from DB
        cur.close()
        conn.close()