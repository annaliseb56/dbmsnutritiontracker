from flask import Blueprint, jsonify, request, session
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
import datetime

goal_bp = Blueprint("goal", __name__)

@goal_bp.route("/goals", methods=["GET"])
def get_goals():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    search_query = request.args.get("q", "")
    today = datetime.date.today()

    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT * FROM goals
            WHERE user_id = %s AND challenge_status NOT IN %s
            ORDER BY date_added DESC
        """
        params = [user_id, ("declined", "pending")]

        cur.execute(query, params)
        goals = cur.fetchall()

        # Attach latest metric
        for goal in goals:
            cur.execute(
                "SELECT current_value, metric_unit FROM goal_metrics WHERE goal_id = %s ORDER BY recorded_date DESC LIMIT 1",
                (goal["goal_id"],)
            )
            metric = cur.fetchone()
            goal["current_value"] = metric["current_value"] if metric else None
            goal["metric_unit"] = metric["metric_unit"] if metric else None

        cur.close()
        conn.close()

        # Filter out past-end-date goals
        visible_goals = []
        for g in goals:
            end_date = g["goal_end_date"]
            if end_date is None or end_date >= today:
                visible_goals.append(g)
        
        # Apply search filter
        if search_query:
            visible_goals = [g for g in visible_goals if search_query.lower() in g["name"].lower()]

        return jsonify({"goals": visible_goals}), 200

    except Exception as e:
        print("Error fetching goals:", e)
        return jsonify({"error": "Failed to fetch goals"}), 500


@goal_bp.route("/goals", methods=["POST"])
def add_goal():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    name = data.get("name")
    goal_type = data.get("goal_type")
    target_value = data.get("target_value")
    goal_end_date = data.get("goal_end_date")
    metric_type = data.get("metric_type") or "numeric"

    if not name or not goal_type or target_value is None:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            """
            INSERT INTO goals (user_id, name, goal_type, target_value, goal_end_date, goal_complete, metric_type)
            VALUES (%s, %s, %s, %s, %s, FALSE, %s)
            RETURNING goal_id
            """,
            (user_id, name, goal_type, target_value, goal_end_date, metric_type)
        )
        goal_id = cur.fetchone()["goal_id"]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "goal": {
                "goal_id": goal_id,
                "name": name,
                "goal_type": goal_type,
                "target_value": target_value,
                "goal_end_date": goal_end_date,
                "goal_complete": False,
                "metric_type": metric_type,
                "current_value": None,
                "metric_unit": None
            }
        }), 200

    except Exception as e:
        print("Error adding goal:", e)
        return jsonify({"error": "Failed to add goal"}), 500


@goal_bp.route("/goals/<int:goal_id>/progress", methods=["POST"])
def log_progress(goal_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    current_value = data.get("current_value")
    metric_unit = data.get("metric_unit") or "None"

    if current_value is None:
        return jsonify({"error": "Missing current value"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Insert progress
        cur.execute(
            "INSERT INTO goal_metrics (goal_id, current_value, metric_unit) VALUES (%s, %s, %s)",
            (goal_id, current_value, metric_unit)
        )

        # Update completion if numeric goal
        cur.execute("SELECT goal_type, target_value, metric_type FROM goals WHERE goal_id = %s", (goal_id,))
        goal = cur.fetchone()
        goal_complete = False
        if goal:
            if goal["metric_type"] == "numeric":
                if goal["goal_type"] == "gte" and float(current_value) >= float(goal["target_value"]):
                    goal_complete = True
                elif goal["goal_type"] == "lte" and float(current_value) <= float(goal["target_value"]):
                    goal_complete = True
            elif goal["metric_type"] == "boolean":
                goal_complete = True

            if goal_complete:
                cur.execute("UPDATE goals SET goal_complete = TRUE WHERE goal_id = %s", (goal_id,))

        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True, "goal_complete": goal_complete}), 200

    except Exception as e:
        print("Error logging progress:", e)
        return jsonify({"error": "Failed to log progress"}), 500


@goal_bp.route("/goals/<int:goal_id>/cancel", methods=["POST"])
def cancel_goal(goal_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM goals WHERE goal_id = %s AND user_id = %s", (goal_id, user_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True}), 200

    except Exception as e:
        print("Error canceling goal:", e)
        return jsonify({"error": "Failed to cancel goal"}), 500
