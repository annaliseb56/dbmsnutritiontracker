from flask import Blueprint, jsonify, session
from utils.db import get_connection
import datetime
from psycopg2.extras import RealDictCursor

# Create blueprint for Track routes
track_bp = Blueprint('track', __name__)

@track_bp.route('/track/data', methods=['GET'])
def get_track_data():
    """Get all tracking data for the logged-in user"""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401
    
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get weight data from progress_tracking
        cur.execute("""
            SELECT recorded_date, weight
            FROM progress_tracking
            WHERE user_id = %s
            ORDER BY recorded_date ASC;
        """, (user_id,))
        weight_data = cur.fetchall()
        
        # Get daily calories eaten (sum of food calories per day)
        cur.execute("""
            SELECT 
                m.meal_date::date as date,
                SUM(f.calories * mf.food_amount / 100) as calories_eaten
            FROM meals m
            LEFT JOIN meal_foods mf ON m.meal_id = mf.meal_id
            LEFT JOIN food f ON mf.food_id = f.food_id
            WHERE m.user_id = %s
            GROUP BY m.meal_date::date
            ORDER BY m.meal_date::date ASC;
        """, (user_id,))
        meals_data = cur.fetchall()
        
        # Get daily calories burned (sum of calories burned per workout)
        cur.execute("""
            SELECT 
                w.workout_date::date as date,
                SUM(w.total_calories_burned) as calories_burned
            FROM workouts w
            WHERE w.user_id = %s
            GROUP BY w.workout_date::date
            ORDER BY w.workout_date::date ASC;
        """, (user_id,))
        workouts_data = cur.fetchall()
        
        # Merge calories data
        calories_dict = {}
        
        # Add meal calories
        for meal in meals_data:
            date_str = meal['date'].isoformat() if meal['date'] else None
            if date_str:
                if date_str not in calories_dict:
                    calories_dict[date_str] = {'date': date_str, 'calories_eaten': 0, 'calories_burned': 0}
                calories_dict[date_str]['calories_eaten'] = float(meal['calories_eaten'] or 0)
        
        # Add workout calories
        for workout in workouts_data:
            date_str = workout['date'].isoformat() if workout['date'] else None
            if date_str:
                if date_str not in calories_dict:
                    calories_dict[date_str] = {'date': date_str, 'calories_eaten': 0, 'calories_burned': 0}
                calories_dict[date_str]['calories_burned'] = float(workout['calories_burned'] or 0)
        
        calories_data = sorted(calories_dict.values(), key=lambda x: x['date'])
        
        # Get daily macronutrient data
        cur.execute("""
            SELECT 
                m.meal_date::date as date,
                SUM(f.protein * mf.food_amount / 100) as protein,
                SUM(f.carbs * mf.food_amount / 100) as carbs,
                SUM(f.total_fat * mf.food_amount / 100) as total_fat,
                SUM(f.saturated_fat * mf.food_amount / 100) as saturated_fat
            FROM meals m
            LEFT JOIN meal_foods mf ON m.meal_id = mf.meal_id
            LEFT JOIN food f ON mf.food_id = f.food_id
            WHERE m.user_id = %s
            GROUP BY m.meal_date::date
            ORDER BY m.meal_date::date ASC;
        """, (user_id,))
        macros_data = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "weightData": [dict(row) for row in weight_data],
            "caloriesData": calories_data,
            "macrosData": [dict(row) for row in macros_data]
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500