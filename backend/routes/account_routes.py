from flask import Blueprint, jsonify, request, session
from utils.db import get_connection
import datetime
from psycopg2.extras import RealDictCursor

account_bp = Blueprint('account', __name__)

@account_bp.route('/account', methods=['GET'])
def get_account():
    print("SESSION:", dict(session))
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "KICKED OUT: NOT LOGGED IN"}), 401

    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT u.username, u.nickname, u.date_of_birth, pt.height, pt.weight, pt.recorded_date
            FROM users u
            LEFT JOIN progress_tracking pt ON pt.user_id = u.user_id
            WHERE u.user_id = %s
            ORDER BY pt.recorded_date DESC NULLS LAST
            LIMIT 1;
        """, (user_id,))
        
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
        cur.close()
        conn.close()


@account_bp.route("/account/update", methods=["POST"])
def update_account():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    nickname = data.get("nickname")
    dob = data.get("date_of_birth")
    new_height = data.get("height")
    new_weight = data.get("weight")

    dob_date = None
    if dob:
        try:
            dob_date = datetime.datetime.strptime(dob, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format (YYYY-MM-DD required)"}), 400

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

        if not has_existing_progress:
            if new_height is None or new_weight is None:
                return jsonify({"error": "Height and weight are required on first entry"}), 400
        else:
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

        conn.commit()
        return jsonify({"message": "Account updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()
