import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./code_editor.db")
WAMP_URL =  os.getenv("WAMP_URL", "ws://localhost:8080/ws")
WAMP_REALM = os.getenv("WAMP_REALM", "realm1")
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
DEBUG = os.getenv("DEBUG", True).lower() == "true"