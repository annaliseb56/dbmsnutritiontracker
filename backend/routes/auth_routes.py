from flask import Blueprint, request, jsonify, session
import datetime
import bcrypt
from utils.db import get_connection

auth = Blueprint("auth", __name__)

@auth.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    dob = data.get("dob")
    password = data.get("password")
    
    if not username or not dob or not password:
        return jsonify({"error" : "All fields are requried"}), 400
    
    try:
        dob_date = datetime.datetime.strptime(dob, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date"}), 400
    
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT 1 FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error":"username already exists, please pick a new one"}), 400

        encrypt_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute(
            "INSERT INTO users (username, password, date_of_birth) VALUES (%s, %s, %s) RETURNING user_id",
            (username, encrypt_pw, dob_date)
        )

        result = cur.fetchone()
        
        new_user_id = result[0]

        conn.commit()
        cur.close()
        conn.close()

        session["user_id"] = new_user_id
        session["username"] = username
        session.permanent = True
        
        return jsonify({"message" : "User registered successfully"}), 201

    except Exception as e:
        print("REGISTER ERROR:", e)   # DEBUG PRINT
        return jsonify({"error": str(e)}), 500

@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"error" : "Please enter both a username and a password"}), 400
    
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT user_id, password FROM users WHERE username=%s", (username,))
        row = cur.fetchone()
        
        if not row:
            return jsonify({"error" : "Invalid username"}), 401
        
        user_id, encrypted_pw = row
        
        if not bcrypt.checkpw(password.encode("utf-8"), encrypted_pw.encode("utf-8")):
            cur.close()
            conn.close()
            return jsonify({"error" : "Invalid password"}), 401
        
        session["user_id"] = user_id
        session["username"] = username
        session.permanent = True
        
        cur.close()
        conn.close()
        return jsonify({"message" : "Successful login"}), 200
    
    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"error": str(e)}), 500

        
@auth.route('/session')
def session_status():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"logged_in" : False})
    
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id, username FROM users WHERE user_id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if user:
        return jsonify({
            "logged_in" : True,
            "user_id" : user[0],
            "username" : user[1]
        })
    else:
        return jsonify({"Logged_in" : False}) 
