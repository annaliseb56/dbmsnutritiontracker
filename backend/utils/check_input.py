import re
import datetime

"""
    All Functions:
    *Returns (True, None) if valid, (False, <error message>) if invalid
"""

"""
    Rules:
    *Check username is provided
    *Check 3-32 characters (Don't want it too long to simplify DB searching, 32 I believe is used by instagram)
    *Letters, numbers, underscores only (don't want a ton of symbols) 
"""
def validate_username(username):
    if not username:
        return False, "Username is required"
    if len(username) < 3 or len(username) > 32:
        return False, "Username must be 3 - 32 characters long"
    if not re.match(r'^\w+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    return True, None

"""
    NOTE: This function will return True, None, dob
    Rules:
    *Msut be able to be converted into date object
"""
def validate_dob(dob):
    try:
        #Convert dob to date object
        dob_date = datetime.datetime.strptime(dob, "%Y-%m-%d").date()
        return True, None, dob_date
    except ValueError:
        return False, "Invalid Date Format"

"""
    Rules:
    *Max of 32 characters
    *Only letters
"""
def validate_nickname(nickname):
    if nickname is None or nickname == "":
        return True, None
    if len(nickname) > 32:
        return False, "Nickname cannot exceed 32 characters"
    if not re.match(r'^[A-Za-z]+$', nickname):
        return False, "Nickname can only contain letters"
    return True, None

"""
    Rules:
    *Height is in inches
    *Must be a positive number
    *Must be less then 120 inches (10 feet)
"""
def validate_height(height):
    if height is None:
        return True, None
    try:
        h = float(height)
        if h <= 0:
            return False, "Height must be positive"
        if h > 120:
            return False, "You're not taller then 10 feet"
        return True, None
    except ValueError:
        return False, "Height must be a number"
    
"""
    Rules:
    *Must be a positive number
"""
def validate_weight(weight):
    if weight is None:
        return True, None
    try:
        w = float(weight)
        if w <= 0:
            return False, "Weight must be postive"
        return True, None
    except ValueError:
        return False, "Weight must be a number"