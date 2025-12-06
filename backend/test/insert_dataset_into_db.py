import pandas as pd
import psycopg2
from utils.db import get_connection
import os
from dotenv import load_dotenv

load_dotenv()

#Load CSV
df = pd.read_csv("test/exercises.csv")  

#connect to DB
conn = get_connection()
cur = conn.cursor()

#Get CARDIO ID
cur.execute("SELECT category_id FROM exercise_categories WHERE name='CARDIO';")
category_id = cur.fetchone()[0]

# Get EFFORT-BASED subcategory ID
cur.execute("""
    SELECT subcategory_id 
    FROM exercise_subcategories 
    WHERE name='Effort-Based' AND category_id=%s;
""", (category_id,))
subcategory_id = cur.fetchone()[0]

# Insert exercises and link to subcategory
for idx, row in df.iterrows():
    activity = row['Activity']
    kcal = row['Calories per kg']

    exercise_key = activity.lower().replace(' ', '_').replace(',', '')

    # Insert exercise
    cur.execute("""
        INSERT INTO exercises (exercise_key, exercise_type, calories_per_kg, category)
        VALUES (%s, %s, %s, %s)
        RETURNING exercise_id;
    """, (exercise_key, activity, kcal, 'cardio'))

    exercise_id = cur.fetchone()[0]
    
    # Link to subcategory
    cur.execute("""
        INSERT INTO exercise_subcategory_links (exercise_id, subcategory_id)
        VALUES (%s, %s);
    """, (exercise_id, subcategory_id))

conn.commit()
cur.close()
conn.close()
print("All CARDIO exercises added successfully!")
