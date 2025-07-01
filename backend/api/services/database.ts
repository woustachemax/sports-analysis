import sqlite3 from 'sqlite3';
import { Match, FormStats, SeasonStats, PredictionInput, Competition } from '../types';

export class DatabaseService {
    private db: sqlite3.Database;

    constructor(dbPath: string) {
        this.db = new sqlite3.Database(dbPath);
        this.initDatabase();
    }

    private initDatabase(): void {
        this.db.serialize(() => {
            this.db.run(`
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
            `);

            this.db.run(`
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
            `);

            this.db.run(`
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_name TEXT,
                    metric_value REAL,
                    period TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        });
    }

    getMatches(limit: number = 50): Promise<Match[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM matches ORDER BY date DESC LIMIT ?',
                [limit],
                (err: Error | null, rows: Match[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    getMatchesByCompetition(competition: string): Promise<Match[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM matches WHERE competition = ? ORDER BY date DESC',
                [competition],
                (err: Error | null, rows: Match[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    getLatestMatch(): Promise<Match | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM matches ORDER BY date DESC LIMIT 1',
                (err: Error | null, row: Match) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    getFormStats(matches: number = 10): Promise<FormStats> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM matches ORDER BY date DESC LIMIT ?',
                [matches],
                (err: Error | null, rows: Match[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (rows.length === 0) {
                        resolve({
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            winPercentage: 0,
                            goalsFor: 0,
                            goalsAgainst: 0,
                            avgPossession: 0,
                            matches: []
                        });
                        return;
                    }

                    const wins = rows.filter(r => r.result === 'W').length;
                    const draws = rows.filter(r => r.result === 'D').length;
                    const losses = rows.filter(r => r.result === 'L').length;
                    const goalsFor = rows.reduce((sum, r) => sum + r.goals_for, 0);
                    const goalsAgainst = rows.reduce((sum, r) => sum + r.goals_against, 0);
                    const avgPossession = rows.reduce((sum, r) => sum + r.possession, 0) / rows.length;

                    resolve({
                        wins,
                        draws,
                        losses,
                        winPercentage: (wins / rows.length) * 100,
                        goalsFor,
                        goalsAgainst,
                        avgPossession: Math.round(avgPossession * 10) / 10,
                        matches: rows
                    });
                }
            );
        });
    }

    insertPrediction(prediction: PredictionInput): Promise<number> {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO predictions 
                (match_date, opponent, venue, competition, predicted_result, 
                 win_probability, draw_probability, loss_probability, confidence, model_version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                prediction.matchDate,
                prediction.opponent,
                prediction.venue,
                prediction.competition,
                prediction.predictedResult,
                prediction.winProbability,
                prediction.drawProbability,
                prediction.lossProbability,
                prediction.confidence,
                prediction.modelVersion
            ], function(this: sqlite3.RunResult, err: Error | null) {
                if (err) reject(err);
                else resolve(this.lastID as number);
            });
        });
    }

    getSeasonStats(): Promise<SeasonStats> {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT 
                    COUNT(*) as total_matches,
                    SUM(CASE WHEN result = 'W' THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
                    SUM(CASE WHEN result = 'L' THEN 1 ELSE 0 END) as losses,
                    SUM(goals_for) as total_goals_for,
                    SUM(goals_against) as total_goals_against,
                    AVG(possession) as avg_possession,
                    SUM(shots) as total_shots,
                    SUM(shots_on_target) as total_shots_on_target,
                    AVG(xg) as avg_xg,
                    SUM(CASE WHEN goals_against = 0 THEN 1 ELSE 0 END) as clean_sheets
                 FROM matches 
                 WHERE date >= date('now', '-365 days')`,
                (err: Error | null, rows: SeasonStats[]) => {
                    if (err) reject(err);
                    else resolve(rows[0]);
                }
            );
        });
    }

    getCompetitions(): Promise<Competition[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT DISTINCT competition, COUNT(*) as matches FROM matches GROUP BY competition ORDER BY matches DESC',
                (err: Error | null, rows: Competition[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    close(): void {
        this.db.close();
    }
}