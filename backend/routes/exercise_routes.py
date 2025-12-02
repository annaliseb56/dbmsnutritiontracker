from flask import Blueprint, request, jsonify, session
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

CARDIO_MET = 7.8  # Generic MET value for cardio if no match found

exercise_bp = Blueprint("exercise_bp", __name__, url_prefix="/exercises")

# Compute auto kcal based on category and name only (no intensity)
def compute_auto_kcal(cur, name, category_str):
    if category_str != "CARDIO":
        # Rough estimate for strength exercises
        default_strength_kcals = {
            "BACK": 4.5,
            "CHEST": 4.8,
            "ARMS": 3.8,
            "LEGS": 5.0,
            "CORE": 4.0,
        }
        return default_strength_kcals.get(category_str, 4.0)

    # Cardio: try to match with global exercises first
    cur.execute("""
        SELECT calories_per_kg
        FROM exercises
        WHERE user_id IS NULL AND exercise_key ILIKE %s
        ORDER BY LENGTH(exercise_key) ASC
        LIMIT 1;
    """, (f"%{name}%",))
    match = cur.fetchone()

    if match:
        return match["calories_per_kg"]

    # Fallback for generic cardio
    return CARDIO_MET

@exercise_bp.get("/subcategories")
def get_subcategories():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        #Get subcategories from database
        cur.execute("""
            SELECT subcategory_id, category_id, name
            FROM exercise_subcategories
            ORDER BY category_id, subcategory_id;
        """)

        rows = cur.fetchall()

        result = {}
        for row in rows:
            cat_id = row["category_id"]
            if cat_id not in result:
                result[cat_id] = []
            result[cat_id].append({
                "subcategory_id": row["subcategory_id"],
                "name": row["name"]
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

#ADD EXERCISES
@exercise_bp.post("/add")
def add_exercise():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    name = data.get("name")
    category_id = data.get("category_id")
    subcategory_ids = data.get("subcategory_ids", [])
    auto_kcal = data.get("auto_kcal", True)
    kcal_manual = data.get("kcal_per_kg")

    if not name or not category_id:
        return jsonify({"error": "Missing name or category"}), 400

    category_map = {
        1: "BACK",
        2: "CHEST",
        3: "ARMS",
        4: "LEGS",
        5: "CORE",
        6: "CARDIO",
    }
    category_str = category_map.get(category_id)
    if not category_str:
        return jsonify({"error": "Invalid category"}), 400

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Determine kcal
        if auto_kcal:
            kcal_value = compute_auto_kcal(cur, name, category_str)
        else:
            kcal_value = kcal_manual

        # Create exercise key
        exercise_key = name.lower().replace(" ", "_").replace(",", "")

        # Insert exercise
        cur.execute("""
            INSERT INTO exercises (exercise_key, exercise_type, calories_per_kg, user_id, category)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING exercise_id;
        """, (exercise_key, name, kcal_value, user_id, category_str))

        exercise_id = cur.fetchone()["exercise_id"]

        # Insert subcategory links
        for sub_id in subcategory_ids:
            cur.execute("""
                INSERT INTO exercise_subcategory_links (exercise_id, subcategory_id)
                VALUES (%s, %s)
            """, (exercise_id, sub_id))

        conn.commit()

        return jsonify({
            "success": True,
            "exercise_id": exercise_id,
            "message": f'Exercise "{name}" created successfully'
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()



        
#MANAGE EXERCISES

#SEARCH for exercises based on user preferences
@exercise_bp.get("/search")
def search_exercises():
    #Validate User
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    #Get data
    name = request.args.get("name")
    category_id = request.args.get("category_id")
    subcategory_id = request.args.get("subcategory_id")

    category_map = {1:"BACK", 2:"CHEST", 3:"ARMS", 4:"LEGS", 5:"CORE", 6:"CARDIO"}

    #Connect to DB
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        #Make basic query to get exercises matching user_id
        query = "SELECT e.exercise_id, e.exercise_type, e.category, e.calories_per_kg FROM exercises e WHERE e.user_id = %s"
        params = [user_id]

        #If there is a name field from the user we will append query and and we will append the name to the params
        if name:
            query += " AND e.exercise_type ILIKE %s"
            params.append(f"%{name}%")
        #If there is a category field from the user we will append the query and append the the params
        if category_id:
            cat_label = category_map.get(int(category_id))
            if cat_label:
                query += " AND e.category = %s"
                params.append(cat_label)
                
        #Same as before but for subcategory
        if subcategory_id:
            query += """
                AND EXISTS (
                    SELECT 1 FROM exercise_subcategory_links esl
                    WHERE esl.exercise_id = e.exercise_id AND esl.subcategory_id = %s
                )
            """
            params.append(int(subcategory_id))

        #Execute query and get returned rows (exercises)
        query += " ORDER BY e.exercise_type ASC"
        cur.execute(query, params)
        exercises = cur.fetchall()

        # Fetch subcategories for each exercise
        exercise_ids = [ex["exercise_id"] for ex in exercises] #list comp to get all exercise_ids of all workouts
        if exercise_ids:
            #Link exercise to subcategories, get all of the available ones for the given exercise ID
            cur.execute("""
                SELECT esl.exercise_id, esc.subcategory_id, esc.name
                FROM exercise_subcategory_links esl
                JOIN exercise_subcategories esc ON esl.subcategory_id = esc.subcategory_id
                WHERE esl.exercise_id = ANY(%s)
            """, (exercise_ids,))
            subcats = cur.fetchall()

            # Map subcategories to exercises
            subcat_map = {}
            for s in subcats:
                #Get a list of subcategories for the current exercise_id, if none create an empty list for the exercise_id
                subcat_map.setdefault(s["exercise_id"], []).append({
                    "subcategory_id": s["subcategory_id"],
                    "name": s["name"]
                })

            #adds subcategory data to each exercise.
            for ex in exercises:
                ex["subcategories"] = subcat_map.get(ex["exercise_id"], [])

        return jsonify({"exercises": exercises})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

#EDIT an exercise
@exercise_bp.put("/edit/<int:exercise_id>")
def edit_exercise(exercise_id):
    #Validate the user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    #Get all data fields
    data = request.json
    name = data.get("name")
    category_id = data.get("category_id")
    subcategory_ids = data.get("subcategory_ids", [])
    kcal_per_kg = data.get("kcal_per_kg")

    #Check for requried fields
    if not name or not category_id:
        return jsonify({"error": "Missing name or category"}), 400

    # Map category_id to label
    category_map = {1:"BACK", 2:"CHEST", 3:"ARMS", 4:"LEGS", 5:"CORE", 6:"CARDIO"}
    category_str = category_map.get(int(category_id))
    if not category_str:
        return jsonify({"error": "Invalid category"}), 400

    #Connect to DB
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Update main exercise fields
        cur.execute("""
            UPDATE exercises
            SET exercise_type = %s, category = %s, calories_per_kg = %s
            WHERE exercise_id = %s AND user_id = %s
        """, (name, category_str, kcal_per_kg, exercise_id, user_id))

        # Delete old subcategories
        cur.execute("""
            DELETE FROM exercise_subcategory_links
            WHERE exercise_id = %s
        """, (exercise_id,))

        # Insert new subcategories
        for sub_id in subcategory_ids:
            cur.execute("""
                INSERT INTO exercise_subcategory_links (exercise_id, subcategory_id)
                VALUES (%s, %s)
            """, (exercise_id, sub_id))

        conn.commit()
        return jsonify({"success": True, "message": "Exercise updated successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

#DELETE an exercise
@exercise_bp.delete("/delete/<int:exercise_id>")
def delete_exercise(exercise_id):
    #Verify user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    #Connect to DB
    conn = get_connection()
    cur = conn.cursor()
    try:
        #Attempt to delete from table and return success if sucessfully deleted
        cur.execute("DELETE FROM exercises WHERE exercise_id = %s AND user_id = %s", (exercise_id, user_id))
        conn.commit()
        return jsonify({"success": True, "message": "Exercise deleted successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()