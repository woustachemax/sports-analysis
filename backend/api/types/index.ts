import WebSocket from 'ws';

export interface Match {
    id?: number;
    date: string;
    opponent: string;
    venue: string;
    competition: string;
    goals_for: number;
    goals_against: number;
    result: 'W' | 'D' | 'L';
    possession: number;
    shots: number;
    shots_on_target: number;
    corners: number;
    fouls: number;
    cards: number;
    xg: number;
    opponent_xg: number;
    created_at?: string;
}

export interface Prediction {
    id?: number;
    match_date?: string;
    opponent: string;
    venue: string;
    competition: string;
    predicted_result?: string;
    win_probability?: number;
    draw_probability?: number;
    loss_probability?: number;
    confidence?: number;
    model_version?: string;
    created_at?: string;
}

export interface PredictionInput {
    matchDate: string;
    opponent: string;
    venue: string;
    competition: string;
    predictedResult: string;
    winProbability: number;
    drawProbability: number;
    lossProbability: number;
    confidence: number;
    modelVersion: string;
}

export interface FormStats {
    wins: number;
    draws: number;
    losses: number;
    winPercentage: number;
    goalsFor: number;
    goalsAgainst: number;
    avgPossession: number;
    matches: Match[];
}

export interface SeasonStats {
    total_matches: number;
    wins: number;
    draws: number;
    losses: number;
    total_goals_for: number;
    total_goals_against: number;
    avg_possession: number;
    total_shots: number;
    total_shots_on_target: number;
    avg_xg: number;
    clean_sheets: number;
}

export interface MLPrediction {
    prediction: string;
    probabilities: {
        Win: number;
        Draw: number;
        Loss: number;
    };
    confidence: number;
    model_version: string;
}

export interface UpcomingMatch {
    id: number;
    opponent: string;
    venue: string;
    competition: string;
    date: string;
    time: string;
}

export interface Competition {
    competition: string;
    matches: number;
}

export interface WebSocketMessage {
    type: string;
    channels?: string[];
}

export interface CustomWebSocket extends WebSocket {
    subscriptions?: string[];
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    total?: number;
    message?: string;
    error?: string;
    details?: string;
}

