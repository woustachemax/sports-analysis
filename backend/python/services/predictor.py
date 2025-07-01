import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from typing import Dict
from config import Config

class AdvancedPredictor:
    def __init__(self):
        self.models = {
            'rf': RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42),
            'gb': GradientBoostingClassifier(n_estimators=150, learning_rate=0.1, random_state=42),
            'lr': LogisticRegression(random_state=42, max_iter=1000)
        }
        self.ensemble_model = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_selector = SelectKBest(f_classif, k=15)
        self.feature_columns = []
        self.model_version = Config.MODEL_VERSION
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        df['is_home'] = (df['venue'] == 'Home').astype(int)
        df['goal_difference'] = df['goals_for'] - df['goals_against']
        df['total_goals'] = df['goals_for'] + df['goals_against']
        df['clean_sheet'] = (df['goals_against'] == 0).astype(int)
        df['big_win'] = (df['goal_difference'] >= 3).astype(int)
        df['high_scoring'] = (df['total_goals'] >= 4).astype(int)
        
        categorical_cols = ['opponent', 'competition']
        for col in categorical_cols:
            le = LabelEncoder()
            df[f'{col}_encoded'] = le.fit_transform(df[col])
            self.label_encoders[col] = le
        
        windows = [3, 5, 10]
        for window in windows:
            df[f'goals_for_avg_{window}'] = df['goals_for'].rolling(window, min_periods=1).mean()
            df[f'goals_against_avg_{window}'] = df['goals_against'].rolling(window, min_periods=1).mean()
            df[f'xg_avg_{window}'] = df['xg'].rolling(window, min_periods=1).mean()
            df[f'possession_avg_{window}'] = df['possession'].rolling(window, min_periods=1).mean()
            df[f'shots_avg_{window}'] = df['shots'].rolling(window, min_periods=1).mean()
            df[f'win_rate_{window}'] = (df['result'] == 'W').rolling(window, min_periods=1).mean()
        
        df['days_since_last_match'] = df['date'].diff().dt.days.fillna(7)
        df['month'] = df['date'].dt.month
        df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6]).astype(int)
        df['season_period'] = pd.cut(df['month'], bins=[0, 3, 6, 9, 12], labels=['Q1', 'Q2', 'Q3', 'Q4'])
        
        result_numeric = {'W': 1, 'D': 0, 'L': -1}
        df['result_numeric'] = df['result'].map(result_numeric)
        df['current_streak'] = df.groupby((df['result_numeric'] != df['result_numeric'].shift()).cumsum()).cumcount() + 1
        df['win_streak'] = ((df['result'] == 'W') * df['current_streak']).where(df['result'] == 'W', 0)
        
        self.feature_columns = [
            'is_home', 'opponent_encoded', 'competition_encoded', 'possession', 'shots', 
            'shots_on_target', 'corners', 'fouls', 'cards', 'xg', 'opponent_xg',
            'goals_for_avg_3', 'goals_against_avg_3', 'goals_for_avg_5', 'goals_against_avg_5',
            'goals_for_avg_10', 'goals_against_avg_10', 'xg_avg_3', 'xg_avg_5', 'xg_avg_10',
            'possession_avg_3', 'possession_avg_5', 'shots_avg_3', 'shots_avg_5',
            'win_rate_3', 'win_rate_5', 'win_rate_10', 'days_since_last_match',
            'month', 'is_weekend', 'win_streak', 'current_streak'
        ]
        
        return df
    
    def train_ensemble(self, df: pd.DataFrame) -> Dict[str, float]:
        X = df[self.feature_columns].fillna(0)
        y = df['result']
        
        X_scaled = self.scaler.fit_transform(X)
        X_selected = self.feature_selector.fit_transform(X_scaled, y)
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_selected, y, test_size=0.2, random_state=42, stratify=y
        )
        
        model_scores = {}
        trained_models = {}
        
        for name, model in self.models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            score = accuracy_score(y_test, y_pred)
            model_scores[name] = score
            trained_models[name] = model
        
        self.ensemble_model = trained_models
        
        ensemble_pred = self.predict_ensemble(X_test)
        ensemble_score = accuracy_score(y_test, ensemble_pred)
        model_scores['ensemble'] = ensemble_score
        
        return model_scores
    
    def predict_ensemble(self, X):
        if not self.ensemble_model:
            raise ValueError("Model not trained")
        
        predictions = []
        for model in self.ensemble_model.values():
            pred_proba = model.predict_proba(X)
            predictions.append(pred_proba)
        
        avg_proba = np.mean(predictions, axis=0)
        return self.ensemble_model['rf'].classes_[np.argmax(avg_proba, axis=1)]
    
    def predict_match_detailed(self, opponent: str, venue: str, competition: str, 
                             recent_stats: Dict) -> Dict:
        input_data = {
            'is_home': 1 if venue.lower() == 'home' else 0,
            'possession': recent_stats.get('avg_possession', 65),
            'shots': recent_stats.get('avg_shots', 15),
            'shots_on_target': recent_stats.get('avg_shots_on_target', 6),
            'corners': recent_stats.get('avg_corners', 8),
            'fouls': recent_stats.get('avg_fouls', 12),
            'cards': recent_stats.get('avg_cards', 2),
            'xg': recent_stats.get('avg_xg', 2.1),
            'opponent_xg': recent_stats.get('avg_opponent_xg', 1.0),
            'goals_for_avg_3': recent_stats.get('goals_for_avg_3', 2.2),
            'goals_against_avg_3': recent_stats.get('goals_against_avg_3', 0.8),
            'goals_for_avg_5': recent_stats.get('goals_for_avg_5', 2.1),
            'goals_against_avg_5': recent_stats.get('goals_against_avg_5', 0.9),
            'goals_for_avg_10': recent_stats.get('goals_for_avg_10', 2.0),
            'goals_against_avg_10': recent_stats.get('goals_against_avg_10', 1.0),
            'xg_avg_3': recent_stats.get('xg_avg_3', 2.1),
            'xg_avg_5': recent_stats.get('xg_avg_5', 2.0),
            'xg_avg_10': recent_stats.get('xg_avg_10', 1.9),
            'possession_avg_3': recent_stats.get('possession_avg_3', 64),
            'possession_avg_5': recent_stats.get('possession_avg_5', 63),
            'shots_avg_3': recent_stats.get('shots_avg_3', 15),
            'shots_avg_5': recent_stats.get('shots_avg_5', 14),
            'win_rate_3': recent_stats.get('win_rate_3', 0.8),
            'win_rate_5': recent_stats.get('win_rate_5', 0.75),
            'win_rate_10': recent_stats.get('win_rate_10', 0.7),
            'days_since_last_match': recent_stats.get('days_since_last_match', 4),
            'month': datetime.now().month,
            'is_weekend': 0,
            'win_streak': recent_stats.get('win_streak', 3),
            'current_streak': recent_stats.get('current_streak', 3)
        }
        
        try:
            input_data['opponent_encoded'] = self.label_encoders['opponent'].transform([opponent])[0]
        except:
            input_data['opponent_encoded'] = 0
            
        try:
            input_data['competition_encoded'] = self.label_encoders['competition'].transform([competition])[0]
        except:
            input_data['competition_encoded'] = 0
        
        input_df = pd.DataFrame([input_data])[self.feature_columns].fillna(0)
        input_scaled = self.scaler.transform(input_df)
        input_selected = self.feature_selector.transform(input_scaled)
        
        predictions = {}
        for name, model in self.ensemble_model.items():
            pred_proba = model.predict_proba(input_selected)[0]
            classes = model.classes_
            predictions[name] = dict(zip(classes, pred_proba))
        
        ensemble_proba = np.mean([list(pred.values()) for pred in predictions.values()], axis=0)
        classes = list(predictions['rf'].keys())
        ensemble_pred_dict = dict(zip(classes, ensemble_proba))
        
        final_prediction = max(ensemble_pred_dict, key=ensemble_pred_dict.get)
        confidence = max(ensemble_proba)
        
        return {
            'prediction': final_prediction,
            'probabilities': {
                'Win': ensemble_pred_dict.get('W', 0),
                'Draw': ensemble_pred_dict.get('D', 0),
                'Loss': ensemble_pred_dict.get('L', 0)
            },
            'confidence': confidence,
            'model_version': self.model_version,
            'individual_models': predictions
        }

