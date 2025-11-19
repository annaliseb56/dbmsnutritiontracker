from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

"""
This is where we create all of the table for database,
queries that we will use for the database can also be
put here as methods.
"""

#TEMP just for testing purposes and such
class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    
    def check_password(self, password, bcrypt):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def set_password(self, password, bcrypt):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")