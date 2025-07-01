import sys
import json
import argparse
from typing import Dict
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.database import DatabaseManager
from services.data_collector import DataCollector
from services.predictor import AdvancedPredictor
from config import Config

class AnalyticsEngine:
    def __init__(self, db_path: str = None):
        self.db_manager = DatabaseManager(db_path)
        self.data_collector = DataCollector()
        self.predictor = AdvancedPredictor()
        self.is_trained = False
    
    def update_data(self):
        matches = self.data_collector.fetch_live_data()
        for match in matches:
            self.db_manager.insert_match(match)
        return f"Updated {len(matches)} matches"
    
    def train_models(self):
        df = self.db_manager.get_all_matches()
        if df.empty:
            self.update_data()
            df = self.db_manager.get_all_matches()
        
        df_processed = self.predictor.engineer_features(df)
        scores = self.predictor.train_ensemble(df_processed)
        self.is_trained = True
        return scores
    
    def get_recent_form(self, n_matches: int = 10) -> Dict:
        df = self.db_manager.get_all_matches()
        recent = df.head(n_matches)
        
        if recent.empty:
            return {
                'avg_possession': 65,
                'avg_shots': 15,
                'avg_shots_on_target': 6,
                'avg_corners': 8,
                'avg_fouls': 12,
                'avg_cards': 2,
                'avg_xg': 2.1,
                'avg_opponent_xg': 1.0,
                'goals_for_avg_3': 2.2,
                'goals_against_avg_3': 0.8,
                'goals_for_avg_5': 2.1,
                'goals_against_avg_5': 0.9,
                'goals_for_avg_10': 2.0,
                'goals_against_avg_10': 1.0,
                'xg_avg_3': 2.1,
                'xg_avg_5': 2.0,
                'xg_avg_10': 1.9,
                'possession_avg_3': 64,
                'possession_avg_5': 63,
                'shots_avg_3': 15,
                'shots_avg_5': 14,
                'win_rate_3': 0.8,
                'win_rate_5': 0.75,
                'win_rate_10': 0.7,
                'days_since_last_match': 4,
                'win_streak': 3,
                'current_streak': 3
            }
        
        return {
            'avg_possession': recent['possession'].mean(),
            'avg_shots': recent['shots'].mean(),
            'avg_shots_on_target': recent['shots_on_target'].mean(),
            'avg_corners': recent['corners'].mean(),
            'avg_fouls': recent['fouls'].mean(),
            'avg_cards': recent['cards'].mean(),
            'avg_xg': recent['xg'].mean(),
            'avg_opponent_xg': recent['opponent_xg'].mean(),
            'goals_for_avg_3': recent.head(3)['goals_for'].mean(),
            'goals_against_avg_3': recent.head(3)['goals_against'].mean(),
            'goals_for_avg_5': recent.head(5)['goals_for'].mean(),
            'goals_against_avg_5': recent.head(5)['goals_against'].mean(),
            'goals_for_avg_10': recent['goals_for'].mean(),
            'goals_against_avg_10': recent['goals_against'].mean(),
            'xg_avg_3': recent.head(3)['xg'].mean(),
            'xg_avg_5': recent.head(5)['xg'].mean(),
            'xg_avg_10': recent['xg'].mean(),
            'possession_avg_3': recent.head(3)['possession'].mean(),
            'possession_avg_5': recent.head(5)['possession'].mean(),
            'shots_avg_3': recent.head(3)['shots'].mean(),
            'shots_avg_5': recent.head(5)['shots'].mean(),
            'win_rate_3': (recent.head(3)['result'] == 'W').mean(),
            'win_rate_5': (recent.head(5)['result'] == 'W').mean(),
            'win_rate_10': (recent['result'] == 'W').mean(),
            'days_since_last_match': 4,
            'win_streak': self.calculate_current_streak(recent),
            'current_streak': self.calculate_current_streak(recent)
        }
    
    def calculate_current_streak(self, df) -> int:
        if df.empty:
            return 0
        
        streak = 0
        last_result = df.iloc[0]['result']
        
        for _, match in df.iterrows():
            if match['result'] == last_result and last_result == 'W':
                streak += 1
            else:
                break
        
        return streak
    
    def predict_upcoming_match(self, opponent: str, venue: str, competition: str) -> Dict:
        if not self.is_trained:
            self.train_models()
        
        recent_stats = self.get_recent_form()
        return self.predictor.predict_match_detailed(opponent, venue, competition, recent_stats)
    
    def get_analytics_summary(self) -> Dict:
        df = self.db_manager.get_all_matches()
        
        if df.empty:
            return {
                'total_matches': 0,
                'recent_form': {
                    'wins': 0,
                    'draws': 0,
                    'losses': 0,
                    'win_percentage': 0
                },
                'latest_match': None,
                'season_stats': {
                    'goals_scored': 0,
                    'goals_conceded': 0,
                    'clean_sheets': 0,
                    'avg_possession': 0,
                    'total_shots': 0,
                    'shot_accuracy': 0
                }
            }
        
        recent_10 = df.head(10)
        
        return {
            'total_matches': len(df),
            'recent_form': {
                'wins': len(recent_10[recent_10['result'] == 'W']),
                'draws': len(recent_10[recent_10['result'] == 'D']),
                'losses': len(recent_10[recent_10['result'] == 'L']),
                'win_percentage': (recent_10['result'] == 'W').mean() * 100
            },
            'latest_match': {
                'date': df.iloc[0]['date'],
                'opponent': df.iloc[0]['opponent'],
                'venue': df.iloc[0]['venue'],
                'result': df.iloc[0]['result'],
                'score': f"{df.iloc[0]['goals_for']}-{df.iloc[0]['goals_against']}",
                'competition': df.iloc[0]['competition']
            },
            'season_stats': {
                'goals_scored': df['goals_for'].sum(),
                'goals_conceded': df['goals_against'].sum(),
                'clean_sheets': len(df[df['goals_against'] == 0]),
                'avg_possession': df['possession'].mean(),
                'total_shots': df['shots'].sum(),
                'shot_accuracy': (df['shots_on_target'].sum() / df['shots'].sum() * 100) if df['shots'].sum() > 0 else 0
            }
        }

def main():
    parser = argparse.ArgumentParser(description='Real Madrid Analytics Engine')
    parser.add_argument('--train-model', action='store_true', help='Train the prediction model')
    parser.add_argument('--update-data', action='store_true', help='Update match data')
    parser.add_argument('--predict', nargs=3, metavar=('opponent', 'venue', 'competition'), help='Predict match outcome')
    parser.add_argument('--summary', action='store_true', help='Get analytics summary')
    
    args = parser.parse_args()
    engine = AnalyticsEngine()
    
    try:
        if args.train_model:
            print("Training models...")
            scores = engine.train_models()
            print("Model Performance:")
            for model, score in scores.items():
                print(f"{model.upper()}: {score:.3f} accuracy")
        
        elif args.update_data:
            print("Updating data...")
            result = engine.update_data()
            print(result)
        
        elif args.predict:
            opponent, venue, competition = args.predict
            print(f"Predicting match: {opponent} ({venue}) - {competition}")
            prediction = engine.predict_upcoming_match(opponent, venue, competition)
            print(json.dumps(prediction, indent=2))
        
        elif args.summary:
            print("Getting analytics summary...")
            summary = engine.get_analytics_summary()
            print(json.dumps(summary, indent=2))
        
        else:
            print("Real Madrid Analytics Engine v2.0")
            print("=" * 50)
            print("Available commands:")
            print("  --train-model    : Train the prediction models")
            print("  --update-data    : Update match data from API")
            print("  --predict OPPONENT VENUE COMPETITION : Predict match outcome")
            print("  --summary        : Get analytics summary")
            print()
            print("Examples:")
            print("  python analytics_engine.py --update-data")
            print("  python analytics_engine.py --train-model")
            print('  python analytics_engine.py --predict "Barcelona" "Home" "La Liga"')
            print("  python analytics_engine.py --summary")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

def create_engine_instance():
    """Factory function to create AnalyticsEngine instance"""
    return AnalyticsEngine()

def quick_prediction(opponent: str, venue: str, competition: str):
    """Quick prediction without command line interface"""
    engine = AnalyticsEngine()
    return engine.predict_upcoming_match(opponent, venue, competition)

def get_team_stats():
    """Get current team statistics"""
    engine = AnalyticsEngine()
    return engine.get_analytics_summary()

def update_and_train():
    """Update data and train models in one go"""
    engine = AnalyticsEngine()
    print("Updating data...")
    update_result = engine.update_data()
    print(update_result)
    
    print("Training models...")
    scores = engine.train_models()
    print("Training complete!")
    return scores

__all__ = [
    'AnalyticsEngine',
    'create_engine_instance', 
    'quick_prediction',
    'get_team_stats',
    'update_and_train'
]