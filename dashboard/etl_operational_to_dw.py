import psycopg2
from psycopg2 import extras
from datetime import datetime
import sys

# Database connection parameters
OPERATIONAL_HOST = "database-1.cobyak6mq07d.us-east-1.rds.amazonaws.com"
WAREHOUSE_HOST = "database-2.cobyak6mq07d.us-east-1.rds.amazonaws.com"
DB_NAME = "postgres"
DB_USER = "postgres"

# Passwords for each database
OPERATIONAL_PASSWORD = "dbmsNutrition2025!"
WAREHOUSE_PASSWORD = "dbmsNutrition2025!"

DB_PORT = 5432

def get_or_create_date_key(cursor_dw, date_value):
    """Get or create date dimension record and return date_key"""
    if not date_value:
        return None
    
    # Extract date components
    if isinstance(date_value, str):
        date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
    
    # Handle both datetime and date objects
    if hasattr(date_value, 'date'):
        date_only = date_value.date()
    else:
        date_only = date_value
    
    date_key = int(date_only.strftime('%Y%m%d'))
    
    # Check if date exists
    cursor_dw.execute("SELECT date_key FROM dim_date WHERE date_key = %s", (date_key,))
    if cursor_dw.fetchone():
        return date_key
    
    # Create new date record
    day_of_week = date_only.strftime('%A')
    day_of_month = date_only.day
    month = date_only.month
    month_name = date_only.strftime('%B')
    quarter = (month - 1) // 3 + 1
    year = date_only.year
    is_weekend = day_of_week in ['Saturday', 'Sunday']
    
    cursor_dw.execute("""
        INSERT INTO dim_date (date_key, full_date, day_of_week, day_of_month, 
                             month, month_name, quarter, year, is_weekend)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (date_key) DO NOTHING
    """, (date_key, date_only, day_of_week, day_of_month, month, 
          month_name, quarter, year, is_weekend))
    
    return date_key

def sync_dim_user(cursor_ops, cursor_dw, conn_dw):
    """Sync users from operational to dim_user"""
    print("\n" + "="*70)
    print("SYNCING DIM_USER")
    print("="*70)
    
    cursor_ops.execute("SELECT user_id, username, created_at FROM users ORDER BY user_id")
    users = cursor_ops.fetchall()
    
    print(f"Found {len(users)} users to sync...")
    synced = 0
    
    for user_id, username, created_at in users:
        try:
            cursor_dw.execute("""
                INSERT INTO dim_user (user_id, username, valid_from, is_current)
                VALUES (%s, %s, %s, true)
            """, (user_id, username, created_at))
            synced += 1
        except psycopg2.IntegrityError:
            # Duplicate key, skip
            conn_dw.rollback()
            continue
        except psycopg2.Error as e:
            print(f"  Error inserting user {user_id}: {e}")
            conn_dw.rollback()
            continue
    
    conn_dw.commit()
    print(f"✓ Synced {synced} users to dim_user")
    
    return synced

def sync_dim_goal(cursor_ops, cursor_dw, conn_dw):
    """Sync goals from operational to dim_goal"""
    print("\n" + "="*70)
    print("SYNCING DIM_GOAL")
    print("="*70)
    
    cursor_ops.execute("SELECT goal_id, goal_type FROM goals ORDER BY goal_id")
    goals = cursor_ops.fetchall()
    
    print(f"Found {len(goals)} goals to sync...")
    synced = 0
    
    for goal_id, goal_type in goals:
        try:
            cursor_dw.execute("""
                INSERT INTO dim_goal (goal_id, goal_type)
                VALUES (%s, %s)
            """, (goal_id, goal_type))
            synced += 1
        except psycopg2.IntegrityError:
            # Duplicate key, skip
            conn_dw.rollback()
            continue
        except psycopg2.Error as e:
            print(f"  Error inserting goal {goal_id}: {e}")
            conn_dw.rollback()
            continue
    
    conn_dw.commit()
    print(f"✓ Synced {synced} goals to dim_goal")
    
    return synced

def sync_fact_progress(cursor_ops, cursor_dw, conn_dw):
    """Sync progress_tracking to fact_progress"""
    print("\n" + "="*70)
    print("SYNCING FACT_PROGRESS")
    print("="*70)
    
    # Get existing progress records in DW (tracking_id stored as source reference)
    cursor_dw.execute("SELECT progress_fact_id FROM fact_progress")
    existing_ids = set(row[0] for row in cursor_dw.fetchall())
    
    cursor_ops.execute("""
        SELECT pt.tracking_id, pt.user_id, pt.goal_id, pt.height, pt.weight, pt.recorded_date
        FROM progress_tracking pt
        ORDER BY pt.tracking_id
    """)
    progress_records = cursor_ops.fetchall()
    
    print(f"Found {len(progress_records)} progress records in operational DB...")
    print(f"Found {len(existing_ids)} existing records in data warehouse...")
    synced = 0
    skipped = 0
    
    for tracking_id, user_id, goal_id, height, weight, recorded_date in progress_records:
        # Get user_key first
        cursor_dw.execute("SELECT user_key FROM dim_user WHERE user_id = %s AND is_current = true", (user_id,))
        user_result = cursor_dw.fetchone()
        if not user_result:
            print(f"  Warning: User {user_id} not found in dim_user, skipping tracking {tracking_id}")
            continue
        user_key = user_result[0]
        
        # Get date_key
        date_key = get_or_create_date_key(cursor_dw, recorded_date)
        
        # Get goal_key if goal_id exists
        goal_key = None
        if goal_id:
            cursor_dw.execute("SELECT goal_key FROM dim_goal WHERE goal_id = %s LIMIT 1", (goal_id,))
            goal_result = cursor_dw.fetchone()
            if goal_result:
                goal_key = goal_result[0]
        
        # Skip if already synced - check if this exact combination exists
        cursor_dw.execute("""
            SELECT 1 FROM fact_progress fp
            WHERE fp.user_key = %s 
            AND fp.date_key = %s
            AND (fp.goal_key = %s OR (fp.goal_key IS NULL AND %s IS NULL))
            AND ABS(COALESCE(fp.weight, 0) - COALESCE(%s, 0)) < 0.01
            LIMIT 1
        """, (user_key, date_key, goal_key, goal_key, weight))
        
        if cursor_dw.fetchone():
            skipped += 1
            continue
        
        # Calculate BMI if height and weight available
        bmi = None
        if height and weight and height > 0:
            height_m = float(height) / 100  # Convert cm to meters
            bmi = round(float(weight) / (height_m * height_m), 2)
        
        try:
            cursor_dw.execute("""
                INSERT INTO fact_progress (user_key, date_key, goal_key, height, weight, bmi)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_key, date_key, goal_key, height, weight, bmi))
            synced += 1
        except psycopg2.Error as e:
            print(f"  Error inserting progress {tracking_id}: {e}")
            conn_dw.rollback()
            continue
    
    conn_dw.commit()
    print(f"✓ Synced {synced} new progress records to fact_progress")
    print(f"✓ Skipped {skipped} existing records")
    
    return synced

def sync_fact_workout(cursor_ops, cursor_dw, conn_dw):
    """Sync workouts and workout_exercises to fact_workout"""
    print("\n" + "="*70)
    print("SYNCING FACT_WORKOUT")
    print("="*70)
    
    cursor_ops.execute("""
        SELECT w.workout_id, w.user_id, w.duration, w.workout_date,
               we.exercise_id, we.exercise_duration
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.workout_id = we.workout_id
        ORDER BY w.workout_id, we.exercise_id
    """)
    workout_records = cursor_ops.fetchall()
    
    print(f"Found {len(workout_records)} workout exercise records to sync...")
    synced = 0
    skipped = 0
    
    for workout_id, user_id, duration, workout_date, exercise_id, exercise_duration in workout_records:
        # Get user_key first
        cursor_dw.execute("SELECT user_key FROM dim_user WHERE user_id = %s AND is_current = true", (user_id,))
        user_result = cursor_dw.fetchone()
        if not user_result:
            print(f"  Warning: User {user_id} not found, skipping workout {workout_id}")
            continue
        user_key = user_result[0]
        
        # Get date_key
        date_key = get_or_create_date_key(cursor_dw, workout_date)
        
        # Get exercise_key
        if not exercise_id:
            print(f"  Warning: No exercise for workout {workout_id}, skipping")
            continue
            
        cursor_dw.execute("SELECT exercise_key FROM dim_exercise WHERE exercise_id = %s", (exercise_id,))
        exercise_result = cursor_dw.fetchone()
        if not exercise_result:
            print(f"  Warning: Exercise {exercise_id} not found in dim_exercise, skipping")
            continue
        exercise_key = exercise_result[0]
        
        # Skip if already synced - check for duplicate
        cursor_dw.execute("""
            SELECT 1 FROM fact_workout fw
            WHERE fw.user_key = %s
            AND fw.date_key = %s
            AND fw.exercise_key = %s
            AND fw.exercise_duration_minutes = %s
            LIMIT 1
        """, (user_key, date_key, exercise_key, exercise_duration))
        
        if cursor_dw.fetchone():
            skipped += 1
            continue
        
        # Calculate calories burned (simplified - would need user weight for accuracy)
        total_calories_burned = None
        
        try:
            cursor_dw.execute("""
                INSERT INTO fact_workout (user_key, date_key, exercise_key, 
                                         workout_duration_minutes, exercise_duration_minutes,
                                         total_calories_burned, workout_count)
                VALUES (%s, %s, %s, %s, %s, %s, 1)
            """, (user_key, date_key, exercise_key, duration, exercise_duration, 
                  total_calories_burned))
            synced += 1
        except psycopg2.Error as e:
            print(f"  Error inserting workout {workout_id}: {e}")
            conn_dw.rollback()
            continue
    
    conn_dw.commit()
    print(f"✓ Synced {synced} new workout records to fact_workout")
    print(f"✓ Skipped {skipped} existing records")
    
    return synced

def sync_fact_nutrition(cursor_ops, cursor_dw, conn_dw):
    """Sync meals and meal_foods to fact_nutrition"""
    print("\n" + "="*70)
    print("SYNCING FACT_NUTRITION")
    print("="*70)
    
    cursor_ops.execute("""
        SELECT m.meal_id, m.user_id, m.meal_date,
               mf.food_id, mf.food_amount
        FROM meals m
        LEFT JOIN meal_foods mf ON m.meal_id = mf.meal_id
        ORDER BY m.meal_id, mf.food_id
    """)
    meal_records = cursor_ops.fetchall()
    
    print(f"Found {len(meal_records)} meal food records to sync...")
    synced = 0
    skipped = 0
    
    for meal_id, user_id, meal_date, food_id, food_amount in meal_records:
        # Get user_key first
        cursor_dw.execute("SELECT user_key FROM dim_user WHERE user_id = %s AND is_current = true", (user_id,))
        user_result = cursor_dw.fetchone()
        if not user_result:
            print(f"  Warning: User {user_id} not found, skipping meal {meal_id}")
            continue
        user_key = user_result[0]
        
        # Get date_key
        date_key = get_or_create_date_key(cursor_dw, meal_date)
        
        # Get food_key and nutrition info
        if not food_id:
            print(f"  Warning: No food for meal {meal_id}, skipping")
            continue
            
        cursor_dw.execute("""
            SELECT food_key, calories_per_100g, protein_per_100g, carbs_per_100g,
                   total_fat_per_100g, saturated_fat_per_100g, cholesterol_per_100g,
                   sodium_per_100g, sugar_per_100g
            FROM dim_food WHERE food_id = %s
        """, (food_id,))
        food_result = cursor_dw.fetchone()
        if not food_result:
            print(f"  Warning: Food {food_id} not found in dim_food, skipping")
            continue
        
        food_key = food_result[0]
        
        # Skip if already synced - check for duplicate
        cursor_dw.execute("""
            SELECT 1 FROM fact_nutrition fn
            WHERE fn.user_key = %s
            AND fn.date_key = %s
            AND fn.food_key = %s
            AND fn.food_amount_grams = %s
            LIMIT 1
        """, (user_key, date_key, food_key, food_amount))
        
        if cursor_dw.fetchone():
            skipped += 1
            continue
        
        # Calculate nutrition totals based on food_amount (grams)
        # Convert Decimal to float for calculations
        amount_factor = float(food_amount or 100) / 100.0
        total_calories = float(food_result[1]) * amount_factor if food_result[1] else None
        total_protein = float(food_result[2]) * amount_factor if food_result[2] else None
        total_carbs = float(food_result[3]) * amount_factor if food_result[3] else None
        total_fat = float(food_result[4]) * amount_factor if food_result[4] else None
        total_saturated_fat = float(food_result[5]) * amount_factor if food_result[5] else None
        total_cholesterol = float(food_result[6]) * amount_factor if food_result[6] else None
        total_sodium = float(food_result[7]) * amount_factor if food_result[7] else None
        total_sugar = float(food_result[8]) * amount_factor if food_result[8] else None
        
        try:
            cursor_dw.execute("""
                INSERT INTO fact_nutrition (user_key, date_key, food_key, food_amount_grams,
                                           total_calories, total_protein, total_carbs, total_fat,
                                           total_saturated_fat, total_cholesterol, total_sodium,
                                           total_sugar, meal_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
            """, (user_key, date_key, food_key, food_amount, total_calories, total_protein,
                  total_carbs, total_fat, total_saturated_fat, total_cholesterol,
                  total_sodium, total_sugar))
            synced += 1
        except psycopg2.Error as e:
            print(f"  Error inserting meal {meal_id}: {e}")
            conn_dw.rollback()
            continue
    
    conn_dw.commit()
    print(f"✓ Synced {synced} new nutrition records to fact_nutrition")
    print(f"✓ Skipped {skipped} existing records")
    
    return synced
    
    return synced

def sync_fact_goal_achievement(cursor_ops, cursor_dw, conn_dw):
    """Sync goals to fact_goal_achievement"""
    print("\n" + "="*70)
    print("SYNCING FACT_GOAL_ACHIEVEMENT")
    print("="*70)
    
    cursor_ops.execute("""
        SELECT goal_id, user_id, date_added, goal_end_date, goal_complete
        FROM goals
        ORDER BY goal_id
    """)
    goal_records = cursor_ops.fetchall()
    
    print(f"Found {len(goal_records)} goal achievement records to sync...")
    synced = 0
    skipped = 0
    
    for goal_id, user_id, date_added, goal_end_date, goal_complete in goal_records:
        # Get user_key first
        cursor_dw.execute("SELECT user_key FROM dim_user WHERE user_id = %s AND is_current = true", (user_id,))
        user_result = cursor_dw.fetchone()
        if not user_result:
            print(f"  Warning: User {user_id} not found, skipping goal {goal_id}")
            continue
        user_key = user_result[0]
        
        # Get goal_key
        cursor_dw.execute("SELECT goal_key FROM dim_goal WHERE goal_id = %s LIMIT 1", (goal_id,))
        goal_result = cursor_dw.fetchone()
        if not goal_result:
            print(f"  Warning: Goal {goal_id} not found in dim_goal, skipping")
            continue
        goal_key = goal_result[0]
        
        # Skip if already synced - check for duplicate
        cursor_dw.execute("""
            SELECT 1 FROM fact_goal_achievement fga
            WHERE fga.user_key = %s
            AND fga.goal_key = %s
            LIMIT 1
        """, (user_key, goal_key))
        
        if cursor_dw.fetchone():
            skipped += 1
            continue
        
        # Get date keys
        start_date_key = get_or_create_date_key(cursor_dw, date_added)
        end_date_key = get_or_create_date_key(cursor_dw, goal_end_date) if goal_end_date else None
        
        # Calculate days to complete
        days_to_complete = None
        if goal_complete and date_added and goal_end_date:
            # Convert to date objects if they're datetime
            start_date = date_added.date() if hasattr(date_added, 'date') else date_added
            end_date = goal_end_date.date() if hasattr(goal_end_date, 'date') else goal_end_date
            days_to_complete = (end_date - start_date).days
        
        try:
            cursor_dw.execute("""
                INSERT INTO fact_goal_achievement (user_key, goal_key, start_date_key, 
                                                  end_date_key, goal_complete, days_to_complete)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_key, goal_key, start_date_key, end_date_key, 
                  goal_complete, days_to_complete))
            synced += 1
        except psycopg2.Error as e:
            print(f"  Error inserting goal achievement {goal_id}: {e}")
            conn_dw.rollback()
            continue
    
    conn_dw.commit()
    print(f"✓ Synced {synced} new goal achievement records to fact_goal_achievement")
    print(f"✓ Skipped {skipped} existing records")
    
    return synced

def main():
    if not OPERATIONAL_PASSWORD or not WAREHOUSE_PASSWORD:
        print("ERROR: Please set both passwords in the script.")
        sys.exit(1)
    
    conn_ops = None
    conn_dw = None
    cursor_ops = None
    cursor_dw = None
    
    try:
        # Connect to operational database
        print(f"Connecting to OPERATIONAL DB: {OPERATIONAL_HOST}...")
        conn_ops = psycopg2.connect(
            host=OPERATIONAL_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=OPERATIONAL_PASSWORD,
            port=DB_PORT
        )
        cursor_ops = conn_ops.cursor()
        print("✓ Connected to operational database!\n")
        
        # Connect to data warehouse
        print(f"Connecting to DATA WAREHOUSE: {WAREHOUSE_HOST}...")
        conn_dw = psycopg2.connect(
            host=WAREHOUSE_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=WAREHOUSE_PASSWORD,
            port=DB_PORT
        )
        cursor_dw = conn_dw.cursor()
        print("✓ Connected to data warehouse!\n")
        
        # Run ETL processes
        total_synced = 0
        
        total_synced += sync_dim_user(cursor_ops, cursor_dw, conn_dw)
        total_synced += sync_dim_goal(cursor_ops, cursor_dw, conn_dw)
        total_synced += sync_fact_progress(cursor_ops, cursor_dw, conn_dw)
        total_synced += sync_fact_workout(cursor_ops, cursor_dw, conn_dw)
        total_synced += sync_fact_nutrition(cursor_ops, cursor_dw, conn_dw)
        total_synced += sync_fact_goal_achievement(cursor_ops, cursor_dw, conn_dw)
        
        print("\n" + "="*70)
        print(f"✓ ETL COMPLETE! Total records synced: {total_synced}")
        print("="*70)
        
    except psycopg2.Error as e:
        print(f"\nDatabase error: {e}")
        if conn_ops:
            conn_ops.rollback()
        if conn_dw:
            conn_dw.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if cursor_ops:
            cursor_ops.close()
        if cursor_dw:
            cursor_dw.close()
        if conn_ops:
            conn_ops.close()
            print("\nOperational database connection closed.")
        if conn_dw:
            conn_dw.close()
            print("Data warehouse connection closed.")

if __name__ == "__main__":
    main()
