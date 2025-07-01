import sqlite3
import pandas as pd
from typing import List
from models.match import MatchData
from config import Config

class DatabaseManager:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or Config.DB_PATH
        self.init_database()
    
    def init_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                opponent TEXT NOT NULL,
                venue TEXT NOT NULL,
                competition TEXT NOT NULL,
                goals_for INTEGER,
                goals_against INTEGER,
                result TEXT,
                possession REAL,
                shots INTEGER,
                shots_on_target INTEGER,
                corners INTEGER,
                fouls INTEGER,
                cards INTEGER,
                xg REAL,
                opponent_xg REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_date TEXT,
                opponent TEXT,
                venue TEXT,
                competition TEXT,
                predicted_result TEXT,
                win_probability REAL,
                draw_probability REAL,
                loss_probability REAL,
                confidence REAL,
                model_version TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def insert_match(self, match_data: MatchData):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO matches 
            (date, opponent, venue, competition, goals_for, goals_against, result, 
             possession, shots, shots_on_target, corners, fouls, cards, xg, opponent_xg)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            match_data.date, match_data.opponent, match_data.venue, match_data.competition,
            match_data.goals_for, match_data.goals_against, match_data.result,
            match_data.possession, match_data.shots, match_data.shots_on_target,
            match_data.corners, match_data.fouls, match_data.cards, match_data.xg, match_data.opponent_xg
        ))
        
        conn.commit()
        conn.close()
    
    def get_all_matches(self) -> pd.DataFrame:
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT * FROM matches ORDER BY date DESC", conn)
        conn.close()
