# ⚽ Real Madrid Analytics

> A comprehensive analytics platform for Real Madrid CF that predicts match outcomes using machine learning and provides detailed performance insights.

## 🌟 What This Does

This project analyzes Real Madrid's performance and predicts upcoming match results using:
- **Historical match data** (goals, possession, shots, etc.)
- **Advanced machine learning models** (Random Forest, Gradient Boosting, Logistic Regression)
- **Real-time data integration** from Football Data API
- **Interactive dashboard** with live statistics

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **Football Data API key** (optional - works without it too!)


## 🎯 Features

### 📊 Match Predictions
- **Win/Draw/Loss probabilities** for upcoming matches
- **Confidence scores** for each prediction
- **Historical accuracy tracking** of the models

### 📈 Performance Analytics
- **Recent form analysis** (last 3, 5, 10 matches)
- **Season statistics** (goals, clean sheets, possession)
- **Competition-specific insights** (La Liga vs Champions League performance)

### 🔄 Real-time Updates
- **Live data sync** from Football Data API
- **WebSocket notifications** for new predictions
- **Automatic model retraining** with new data

### 🎮 API Endpoints
```bash
GET  /api/health              
GET  /api/matches             
GET  /api/stats/form          
POST /api/predict             
POST /api/model/train         
```

## 🏗️ Architecture

```
real-madrid-analytics/
├── backend/
│   ├── api/                  
│   │   ├── src/
│   │   │   ├── routes/     
│   │   │   ├── services/    
│   │   │   └── types/       
│   │   └── package.json
│   ── python/              
│       ├── services/        
│       ├── models/          
│       └── analytics_engine.py
│   
└── README.md
```

## 🧠 How the ML Works

### Data Collection
- **Live API data** from Football-Data.org (when available)
- **Realistic mock data** generated for development
- **200+ historical matches** across competitions

### Feature Engineering
- **Rolling averages** (goals, possession, shots over 3/5/10 games)
- **Venue effects** (home vs away performance)
- **Opposition strength** modeling
- **Seasonal patterns** and form streaks

### Model Ensemble
- **Random Forest** (200 trees) for stability
- **Gradient Boosting** for pattern detection  
- **Logistic Regression** for interpretability
- **Ensemble voting** for final predictions

## 🎯 Example Usage

### Predict a Match
```bash
python analytics_engine.py --predict "Barcelona" "Home" "La Liga"
```

### Get Team Stats
```bash
curl http://localhost:3001/api/stats/form?matches=10
```

### Train Models
```bash
curl -X POST http://localhost:3001/api/model/train
```


## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b amazing-feature`)
3. **Add** your changes with tests
4. **Commit** (`git commit -m 'Add amazing feature'`)
5. **Push** and create a **Pull Request**

## 📝 Notes

- **No API key?** No problem! The system generates realistic data
- **Models update automatically** as new match data comes in
- **SQLite database** stores everything locally
- **WebSocket updates** keep the frontend in sync

## 🏆 Hala Madrid!

Built with ❤️ for Real Madrid fans who love CS as much as football.

---

*"In football, everything is complicated by the presence of the opposite team." - Jean-Paul Sartre*