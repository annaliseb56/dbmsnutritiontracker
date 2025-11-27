import os
from dotenv import load_dotenv

#load in environment variables
load_dotenv()

"""
This class will hold the configuration settings for the flask backend
"""
class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    #Use the environment variables to login and load postgreSQL database
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    #Often used with flask to store information on the server's disk, good for security too.
    SESSION_TYPE = "filesystem"

    JWT_SECRET = os.getenv("JWT_SECRET")
