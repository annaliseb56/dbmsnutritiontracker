from flask import Blueprint, request, jsonify, session
from utils.db import get_connection
import datetime
from psycopg2.extras import RealDictCursor
import requests
import os
from dotenv import load_dotenv

load_dotenv()

meal_bp = Blueprint('meals', __name__)

#Convert empty strings to None for Database
def empty_to_none(v):
    return v if v not in ("", None) else None

#Get a user's meal history
@meal_bp.route("/meals/history", methods=["GET"])
def get_meal_history():

    #Verify user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    #Get optional search query parameter
    search_query = request.args.get("search", "").strip()

    #Connect to the DB
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Fetch only original meals (not reused instances) and order them by date
        if search_query:
            cur.execute("""
                SELECT meal_id, meal_date, meal_type, meal_name
                FROM meals
                WHERE user_id = %s
                AND parent_meal_id IS NULL
                AND (LOWER(meal_name) LIKE LOWER(%s) OR LOWER(meal_type) LIKE LOWER(%s))
                ORDER BY meal_date DESC
            """, (user_id, f"%{search_query}%", f"%{search_query}%"))
        else:
            cur.execute("""
                SELECT meal_id, meal_date, meal_type, meal_name
                FROM meals
                WHERE user_id = %s
                AND parent_meal_id IS NULL
                ORDER BY meal_date DESC
            """, (user_id,))
        meals = cur.fetchall()
        
        # Attach foods for each meal
        for meal in meals:

            #DB holds as meal_name but frontend wants name as the key (so this changes that)
            meal["name"] = meal.pop("meal_name", None)
            
            #Convert meal_date to string format
            if meal["meal_date"]:
                meal["meal_date"] = meal["meal_date"].strftime("%Y-%m-%d")

            #Get the food in each meal
            cur.execute("""
                SELECT 
                    f.food_id,
                    f.description,
                    f.calories,
                    f.protein,
                    f.carbs,
                    f.total_fat,
                    f.saturated_fat,
                    f.cholesterol,
                    f.sodium,
                    f.sugar,
                    mf.food_amount
                FROM meal_foods mf
                JOIN food f ON f.food_id = mf.food_id
                WHERE mf.meal_id = %s
            """, (meal["meal_id"],))
            meal["foods"] = cur.fetchall()

        #Return a JSON of all of the meals
        return jsonify(meals)

    finally:
        #Disconnect from the DB
        cur.close()
        conn.close()

#add a new custom meal
@meal_bp.route("/meals/add", methods=["POST"])
def add_custom_meal():

    #Verify the user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    #Get the JSON from frontend
    data = request.get_json()

    #Check meal name and type are provided
    if not data.get("name") or not data.get("meal_type"):
        return jsonify({"error": "Missing meal name or meal type"}), 400

    #Check that foods array is provided
    foods = data.get("foods")
    if not foods or len(foods) == 0:
        return jsonify({"error": "No foods provided"}), 400

    #Convert meal_date - extract just the date part to avoid timezone issues
    meal_date_input = data.get("meal_date")
    if meal_date_input:
        try:
            date_part = meal_date_input.split("T")[0] if "T" in meal_date_input else meal_date_input
            meal_date = datetime.datetime.strptime(date_part, "%Y-%m-%d").date()
        except:
            meal_date = datetime.datetime.now().date()
    else:
        meal_date = datetime.datetime.now().date()

    #Connect to the DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Insert meal (meals table DOES NOT contain any macros)
        cur.execute("""
            INSERT INTO meals (user_id, meal_date, meal_type, meal_name)
            VALUES (%s, %s, %s, %s)
            RETURNING meal_id
        """, (user_id, meal_date, data["meal_type"], data["name"]))
        meal_id = cur.fetchone()[0]

        # Insert each food and link to meal
        for food in foods:
            required = ["name", "calories", "protein", "carbs", "total_fat", "saturated_fat", "food_amount"]
            for field in required:
                if field not in food or food[field] in ("", None):
                    raise ValueError(f"Missing required field in food: {field}")

            cholesterol = empty_to_none(food.get("cholesterol"))
            sodium = empty_to_none(food.get("sodium"))
            sugar = empty_to_none(food.get("sugar"))

            # Insert food row (custom food owned by user)
            cur.execute("""
                INSERT INTO food (
                    description, calories, protein, carbs,
                    total_fat, saturated_fat, cholesterol, sodium, sugar, user_id
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING food_id
            """, (
                food["name"],
                food["calories"],
                food["protein"],
                food["carbs"],
                food["total_fat"],
                food["saturated_fat"],
                cholesterol,
                sodium,
                sugar,
                user_id
            ))
            food_id = cur.fetchone()[0]

            # Insert meal-food link
            cur.execute("""
                INSERT INTO meal_foods (meal_id, food_id, food_amount)
                VALUES (%s, %s, %s)
            """, (meal_id, food_id, food["food_amount"]))

        #Commit to the DB return that the meals was successfully added to the Frontend
        conn.commit()
        return jsonify({
            "message": "Meal added successfully",
            "meal_id": meal_id
        })

    except Exception as e:
        #If error rollback changes and return error to frontend
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        #Disconnect from the DB
        cur.close()
        conn.close()

#Reuse a previously added meal or save meal from search
@meal_bp.route("/meals/reuse", methods=["POST"])
def reuse_meal():
    #Verify the user and get the frontend JSON
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
    data = request.get_json()

    #Ensure food data sent from Frontend
    foods = data.get("foods")
    if not foods:
        return jsonify({"error": "No foods provided"}), 400

    #Set the name, type, and date for the meal
    meal_name = data.get("name") 
    meal_type = data.get("meal_type") or "Custom"
    meal_date_input = data.get("meal_date")
    
    if not meal_date_input or meal_date_input == "":
        meal_date = datetime.datetime.now().date()
    else:
        try:
            date_part = meal_date_input.split("T")[0] if "T" in meal_date_input else meal_date_input
            meal_date = datetime.datetime.strptime(date_part, "%Y-%m-%d").date()
        except:
            meal_date = datetime.datetime.now().date()
    
    #Get the original meal ID if reusing an existing meal
    parent_meal_id = data.get("meal_id")

    #Connect to the DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Create new meal entry with the specified date
        cur.execute("""
            INSERT INTO meals (user_id, meal_date, meal_type, meal_name, parent_meal_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING meal_id
        """, (user_id, meal_date, meal_type, meal_name, parent_meal_id))
        meal_id = cur.fetchone()[0]

        # Attach all foods with amounts
        for f in foods:
            food_id = f.get("food_id")
            food_amount = f.get("food_amount")
            
            # Check if this is a new food from USDA search (has nutrition data)
            if "description" in f and "calories" in f:
                # This is a new food from search results - insert it without user_id (shared food)
                description = f.get("description", "")
                calories = f.get("calories")
                protein = f.get("protein")
                carbs = f.get("carbs")
                total_fat = f.get("total_fat")
                saturated_fat = f.get("saturated_fat")
                cholesterol = empty_to_none(f.get("cholesterol"))
                sodium = empty_to_none(f.get("sodium"))
                sugar = empty_to_none(f.get("sugar"))
                
                # Insert food into database WITHOUT user_id (NULL = shared)
                cur.execute("""
                    INSERT INTO food (
                        description, calories, protein, carbs,
                        total_fat, saturated_fat, cholesterol, sodium, sugar, user_id
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NULL)
                    RETURNING food_id
                """, (
                    description,
                    calories,
                    protein,
                    carbs,
                    total_fat,
                    saturated_fat,
                    cholesterol,
                    sodium,
                    sugar
                ))
                food_id = cur.fetchone()[0]
            
            # Now link the food to the meal
            cur.execute("""
                INSERT INTO meal_foods (meal_id, food_id, food_amount)
                VALUES (%s, %s, %s)
            """, (meal_id, food_id, food_amount))

        conn.commit()

        return jsonify({"message": "Meal logged successfully", "meal_id": meal_id})

    except Exception as e:
        #If failed then rollback database changes made and return the error to the frontend
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        #Disconnect from the DB
        cur.close()
        conn.close()

#Get all logged meals (including reused instances) for a user
@meal_bp.route("/meals/logged", methods=["GET"])
def get_logged_meals():
    #Verify user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    #Get optional search query parameter
    search_query = request.args.get("search", "").strip()

    #Connect to the DB
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Fetch all meals including reused instances
        if search_query:
            cur.execute("""
                SELECT meal_id, meal_date, meal_type, meal_name
                FROM meals
                WHERE user_id = %s
                AND (LOWER(meal_name) LIKE LOWER(%s) OR LOWER(meal_type) LIKE LOWER(%s))
                ORDER BY meal_date DESC
            """, (user_id, f"%{search_query}%", f"%{search_query}%"))
        else:
            cur.execute("""
                SELECT meal_id, meal_date, meal_type, meal_name
                FROM meals
                WHERE user_id = %s
                ORDER BY meal_date DESC
            """, (user_id,))
        meals = cur.fetchall()

        # Attach foods for each meal
        for meal in meals:
            meal["name"] = meal.pop("meal_name", None)
            
            #Convert meal_date to string format
            if meal["meal_date"]:
                meal["meal_date"] = meal["meal_date"].strftime("%Y-%m-%d")
            
            cur.execute("""
                SELECT 
                    f.food_id,
                    f.description,
                    f.calories,
                    f.protein,
                    f.carbs,
                    f.total_fat,
                    f.saturated_fat,
                    f.cholesterol,
                    f.sodium,
                    f.sugar,
                    f.user_id,
                    mf.food_amount
                FROM meal_foods mf
                JOIN food f ON f.food_id = mf.food_id
                WHERE mf.meal_id = %s
            """, (meal["meal_id"],))
            meal["foods"] = cur.fetchall()

        return jsonify(meals)

    finally:
        cur.close()
        conn.close()

#Edit a meal (date, name, type, and food amounts)
@meal_bp.route("/meals/edit", methods=["PUT"])
def edit_meal():
    #Verify user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    meal_id = data.get("meal_id")

    if not meal_id:
        return jsonify({"error": "Missing meal_id"}), 400

    #Connect to the DB
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Verify meal belongs to user
        cur.execute("SELECT meal_id FROM meals WHERE meal_id = %s AND user_id = %s", (meal_id, user_id))
        if not cur.fetchone():
            return jsonify({"error": "Meal not found or unauthorized"}), 403

        # Update meal metadata
        meal_date_str = data.get("meal_date")
        meal_date = None
        if meal_date_str:
            try:
                date_part = meal_date_str.split("T")[0] if "T" in meal_date_str else meal_date_str
                meal_date = datetime.datetime.strptime(date_part, "%Y-%m-%d").date()
            except:
                pass

        meal_name = data.get("name")
        meal_type = data.get("meal_type")

        if meal_date or meal_name or meal_type:
            cur.execute("""
                UPDATE meals
                SET meal_date = COALESCE(%s, meal_date),
                    meal_name = COALESCE(%s, meal_name),
                    meal_type = COALESCE(%s, meal_type)
                WHERE meal_id = %s
            """, (meal_date, meal_name, meal_type, meal_id))

        # Update food amounts in meal_foods
        foods = data.get("foods", [])
        for food in foods:
            food_id = food.get("food_id")
            food_amount = food.get("food_amount")
            
            if food_id and food_amount:
                cur.execute("""
                    UPDATE meal_foods
                    SET food_amount = %s
                    WHERE meal_id = %s AND food_id = %s
                """, (food_amount, meal_id, food_id))

        conn.commit()
        return jsonify({"message": "Meal updated successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

#Delete a meal
@meal_bp.route("/meals/delete", methods=["DELETE"])
def delete_meal():
    #Verify user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    meal_id = request.args.get("meal_id")

    if not meal_id:
        return jsonify({"error": "Missing meal_id"}), 400

    #Connect to the DB
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Verify meal belongs to user
        cur.execute("SELECT meal_id FROM meals WHERE meal_id = %s AND user_id = %s", (meal_id, user_id))
        if not cur.fetchone():
            return jsonify({"error": "Meal not found or unauthorized"}), 403

        # Delete the meal (meal_foods will cascade delete)
        cur.execute("DELETE FROM meals WHERE meal_id = %s", (meal_id,))
        conn.commit()

        return jsonify({"message": "Meal deleted successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

#Search for foods from database first, then USDA API
@meal_bp.route("/meals/food/search", methods=["GET"])
def search_food():
    #Verify user
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    #Get search query parameter
    search_query = request.args.get("query", "").strip()
    if not search_query:
        return jsonify({"error": "Missing search query"}), 400

    try:
        # First, search in database for shared foods (user_id is NULL)
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT food_id, description, calories, protein, carbs, 
                   total_fat, saturated_fat, cholesterol, sodium, sugar
            FROM food
            WHERE user_id IS NULL
            AND LOWER(description) LIKE LOWER(%s)
            LIMIT 1
        """, (f"%{search_query}%",))
        
        food_result = cur.fetchone()
        cur.close()
        conn.close()
        
        # If found in database, return it
        if food_result:
            return jsonify(dict(food_result))
        
        # If not found in database, query USDA API
        api_key = os.getenv("USDA_KEY")
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            "api_key": api_key,
            "query": search_query,
            "pageSize": 1  # Only request 1 result
        }
        response = requests.get(url, params=params)
        data = response.json()

        if "foods" not in data or len(data["foods"]) == 0:
            return jsonify({"error": "Could not find food, Try Again"}), 404

        food = data["foods"][0]
        nutrients = food.get("foodNutrients", [])
        
        #Extract macronutrients
        macros = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "total_fat": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 0,
            "sugar": 0
        }
        
        #Go through each nutrient and assign it to its respective macro
        for n in nutrients:
            nutrient_name = n.get("nutrientName", "")
            value = n.get("value", 0)

            if nutrient_name == "Energy":
                macros["calories"] = value
            elif nutrient_name == "Protein":
                macros["protein"] = value
            elif nutrient_name == "Carbohydrate, by difference":
                macros["carbs"] = value
            elif nutrient_name == "Total lipid (fat)":
                macros["total_fat"] = value
            elif nutrient_name == "Fatty acids, total saturated":
                macros["saturated_fat"] = value
            elif nutrient_name == "Cholesterol":
                macros["cholesterol"] = value
            elif nutrient_name == "Sodium, Na":
                macros["sodium"] = value
            elif nutrient_name == "Sugars, total including NLEA":
                macros["sugar"] = value 

        result = {
            "food_id": food.get("fdcId"),
            "description": food.get("description", ""),
            **macros
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500