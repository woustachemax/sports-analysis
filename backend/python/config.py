import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FOOTBALL_DATA_API_KEY = os.getenv('FOOTBALL_DATA_API_KEY')
    DB_PATH = os.getenv('DB_PATH', 'real_madrid_analytics.db')
    BASE_URL = "https://api.football-data.org/v4"
    REAL_MADRID_ID = 86
    MODEL_VERSION = "2.0"
