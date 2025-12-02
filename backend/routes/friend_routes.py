from flask import Blueprint, request, jsonify, session
from utils.db import get_connection
import datetime
from psycopg2.extras import RealDictCursor

friend_bp = Blueprint('friend', __name__)

# Middleware to check if user is logged in
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Get all friends data (friends, pending requests, challenges)
@friend_bp.route('/api/friends/all', methods=['GET'])
@login_required
def get_all_friends_data():
    user_id = session['user_id']
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get accepted friends
        cursor.execute("""
            SELECT u.user_id, u.username, u.nickname
            FROM friends f
            JOIN users u ON (f.friend_id = u.user_id)
            WHERE f.user_id = %s AND f.status = 'accepted'
            UNION
            SELECT u.user_id, u.username, u.nickname
            FROM friends f
            JOIN users u ON (f.user_id = u.user_id)
            WHERE f.friend_id = %s AND f.status = 'accepted'
        """, (user_id, user_id))
        friends = cursor.fetchall()
        
        # Get pending friend requests (received by current user)
        cursor.execute("""
            SELECT f.friendship_id, u.user_id, u.username, u.nickname, 
                   f.created_at
            FROM friends f
            JOIN users u ON f.user_id = u.user_id
            WHERE f.friend_id = %s AND f.status = 'pending'
            ORDER BY f.created_at DESC
        """, (user_id,))
        pending_requests = cursor.fetchall()
        
        # Get challenges (goals) sent to current user that are pending
        cursor.execute("""
            SELECT g.goal_id, g.goal_type, g.name, g.target_value, 
                   g.goal_end_date, g.date_added, g.metric_type,
                   u.user_id, u.username, u.nickname
            FROM goals g
            JOIN users u ON g.created_by_user_id = u.user_id
            WHERE g.challenged_user_id = %s AND g.challenge_status = 'pending'
            ORDER BY g.date_added DESC
        """, (user_id,))
        challenges = cursor.fetchall()
        
        # Format the data
        friends_list = [
            {
                'id': str(f['user_id']),
                'username': f['username']
            }
            for f in friends
        ]
        
        pending_list = [
            {
                'id': str(r['friendship_id']),
                'user': {
                    'user_id': r['user_id'],
                    'username': r['username']
                },
                'date': format_time_ago(r['created_at'])
            }
            for r in pending_requests
        ]
        
        challenges_list = [
            {
                'id': str(c['goal_id']),
                'from': {
                    'user_id': c['user_id'],
                    'username': c['username']
                },
                'type': c['goal_type'],
                'description': format_challenge_description(c),
                'date': format_time_ago(c['date_added'])
            }
            for c in challenges
        ]
        
        return jsonify({
            'friends': friends_list,
            'pendingRequests': pending_list,
            'challenges': challenges_list
        }), 200
        
    except Exception as e:
        print(f"Error fetching friends data: {e}")
        return jsonify({'error': 'Failed to fetch friends data'}), 500
    finally:
        cursor.close()
        conn.close()

# Search for users
@friend_bp.route('/api/friends/search', methods=['GET'])
@login_required
def search_users():
    user_id = session['user_id']
    query = request.args.get('query', '').strip()
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Search for users excluding current user
        cursor.execute("""
            SELECT user_id, username, nickname
            FROM users
            WHERE username ILIKE %s AND user_id != %s
            LIMIT 20
        """, (f'%{query}%', user_id))
        users = cursor.fetchall()
        
        # Check friendship status for each user
        results = []
        for user in users:
            cursor.execute("""
                SELECT status FROM friends
                WHERE (user_id = %s AND friend_id = %s)
                   OR (user_id = %s AND friend_id = %s)
            """, (user_id, user['user_id'], user['user_id'], user_id))
            
            friendship = cursor.fetchone()
            status = friendship['status'] if friendship else None
            
            results.append({
                'user_id': user['user_id'],
                'username': user['username'],
                'nickname': user['nickname'],
                'friendshipStatus': status
            })
        
        return jsonify({'users': results}), 200
        
    except Exception as e:
        print(f"Error searching users: {e}")
        return jsonify({'error': 'Failed to search users'}), 500
    finally:
        cursor.close()
        conn.close()

# Send friend request
@friend_bp.route('/api/friends/request', methods=['POST'])
@login_required
def send_friend_request():
    user_id = session['user_id']
    data = request.get_json()
    friend_id = data.get('friend_id')
    
    if not friend_id:
        return jsonify({'error': 'Friend ID required'}), 400
    
    if user_id == friend_id:
        return jsonify({'error': 'Cannot send friend request to yourself'}), 400
    
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if friendship already exists
        cursor.execute("""
            SELECT * FROM friends
            WHERE (user_id = %s AND friend_id = %s)
               OR (user_id = %s AND friend_id = %s)
        """, (user_id, friend_id, friend_id, user_id))
        
        existing = cursor.fetchone()
        if existing:
            return jsonify({'error': 'Friend request already exists'}), 400
        
        # Insert friend request
        cursor.execute("""
            INSERT INTO friends (user_id, friend_id, status)
            VALUES (%s, %s, 'pending')
            RETURNING friendship_id
        """, (user_id, friend_id))
        
        conn.commit()
        return jsonify({'message': 'Friend request sent'}), 201
        
    except Exception as e:
        conn.rollback()
        print(f"Error sending friend request: {e}")
        return jsonify({'error': 'Failed to send friend request'}), 500
    finally:
        cursor.close()
        conn.close()

# Accept friend request
@friend_bp.route('/api/friends/accept/<int:friendship_id>', methods=['POST'])
@login_required
def accept_friend_request(friendship_id):
    user_id = session['user_id']
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Verify this request is for the current user
        cursor.execute("""
            UPDATE friends
            SET status = 'accepted', updated_at = NOW()
            WHERE friendship_id = %s AND friend_id = %s AND status = 'pending'
            RETURNING friendship_id
        """, (friendship_id, user_id))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Friend request not found'}), 404
        
        conn.commit()
        return jsonify({'message': 'Friend request accepted'}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Error accepting friend request: {e}")
        return jsonify({'error': 'Failed to accept friend request'}), 500
    finally:
        cursor.close()
        conn.close()

# Decline friend request
@friend_bp.route('/api/friends/decline/<int:friendship_id>', methods=['POST'])
@login_required
def decline_friend_request(friendship_id):
    user_id = session['user_id']
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Delete the friend request
        cursor.execute("""
            DELETE FROM friends
            WHERE friendship_id = %s AND friend_id = %s AND status = 'pending'
            RETURNING friendship_id
        """, (friendship_id, user_id))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Friend request not found'}), 404
        
        conn.commit()
        return jsonify({'message': 'Friend request declined'}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Error declining friend request: {e}")
        return jsonify({'error': 'Failed to decline friend request'}), 500
    finally:
        cursor.close()
        conn.close()

# Remove friend
@friend_bp.route('/api/friends/remove/<int:friend_user_id>', methods=['DELETE'])
@login_required
def remove_friend(friend_user_id):
    user_id = session['user_id']
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Delete the friendship (both directions)
        cursor.execute("""
            DELETE FROM friends
            WHERE ((user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s))
              AND status = 'accepted'
            RETURNING friendship_id
        """, (user_id, friend_user_id, friend_user_id, user_id))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Friendship not found'}), 404
        
        conn.commit()
        return jsonify({'message': 'Friend removed'}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Error removing friend: {e}")
        return jsonify({'error': 'Failed to remove friend'}), 500
    finally:
        cursor.close()
        conn.close()

# Send challenge (create a goal for another user)
@friend_bp.route('/api/challenges/send', methods=['POST'])
@login_required
def send_challenge():
    user_id = session['user_id']
    data = request.get_json()
    
    friend_id = data.get('friend_id')
    goal_type = data.get('goal_type')
    name = data.get('name')
    target_value = data.get('target_value')
    goal_end_date = data.get('goal_end_date')
    metric_type = data.get('metric_type', 'numeric')
    
    if not all([friend_id, goal_type, name, target_value]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Verify they are friends
        cursor.execute("""
            SELECT * FROM friends
            WHERE ((user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s))
              AND status = 'accepted'
        """, (user_id, friend_id, friend_id, user_id))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Can only send challenges to friends'}), 403
        
        # Create the challenge goal
        cursor.execute("""
            INSERT INTO goals (
                user_id, goal_type, name, target_value, goal_end_date, 
                metric_type, challenged_user_id, challenge_status, created_by_user_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            RETURNING goal_id
        """, (friend_id, goal_type, name, target_value, goal_end_date, 
              metric_type, friend_id, user_id))
        
        result = cursor.fetchone()
        conn.commit()
        
        return jsonify({
            'message': 'Challenge sent',
            'goal_id': result['goal_id']
        }), 201
        
    except Exception as e:
        conn.rollback()
        print(f"Error sending challenge: {e}")
        return jsonify({'error': 'Failed to send challenge'}), 500
    finally:
        cursor.close()
        conn.close()

# Accept challenge
@friend_bp.route('/api/challenges/accept/<int:goal_id>', methods=['POST'])
@login_required
def accept_challenge(goal_id):
    user_id = session['user_id']
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("""
            UPDATE goals
            SET challenge_status = 'accepted'
            WHERE goal_id = %s AND challenged_user_id = %s AND challenge_status = 'pending'
            RETURNING goal_id
        """, (goal_id, user_id))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Challenge not found'}), 404
        
        conn.commit()
        return jsonify({'message': 'Challenge accepted'}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Error accepting challenge: {e}")
        return jsonify({'error': 'Failed to accept challenge'}), 500
    finally:
        cursor.close()
        conn.close()

# Decline challenge
@friend_bp.route('/api/challenges/decline/<int:goal_id>', methods=['POST'])
@login_required
def decline_challenge(goal_id):
    user_id = session['user_id']
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("""
            UPDATE goals
            SET challenge_status = 'declined'
            WHERE goal_id = %s AND challenged_user_id = %s AND challenge_status = 'pending'
            RETURNING goal_id
        """, (goal_id, user_id))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Challenge not found'}), 404
        
        conn.commit()
        return jsonify({'message': 'Challenge declined'}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Error declining challenge: {e}")
        return jsonify({'error': 'Failed to decline challenge'}), 500
    finally:
        cursor.close()
        conn.close()

# Helper function to format challenge description
def format_challenge_description(goal):
    """Format a goal object into a readable challenge description"""
    name = goal.get('name', 'Unnamed Challenge')
    target = goal.get('target_value', 0)
    goal_type = goal.get('goal_type', '')
    metric = goal.get('metric_type', 'numeric')
    end_date = goal.get('goal_end_date')
    
    description = f"{name}"
    
    if target:
        description += f" - Target: {target}"
        if metric != 'numeric':
            description += f" {metric}"
    
    if end_date:
        description += f" by {end_date}"
    
    return description

# Helper function to format time ago
def format_time_ago(timestamp):
    if not timestamp:
        return "Unknown"
    
    now = datetime.datetime.now()
    diff = now - timestamp
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 2592000:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    else:
        months = int(seconds / 2592000)
        return f"{months} month{'s' if months != 1 else ''} ago"