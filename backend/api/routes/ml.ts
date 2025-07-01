import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { PythonMLService } from '../services/ml';
import { ApiResponse, MLPrediction } from '../types';

export const createMLRoutes = (
    dbService: DatabaseService, 
    mlService: PythonMLService, 
    broadcastToClients: (data: any) => void
) => {
    const router = Router();

    router.post('/train', async (req: Request, res: Response) => {
        try {
            const results = await mlService.trainModel();
            
            broadcastToClients({
                type: 'model_updated',
                data: { trained: true, timestamp: new Date() }
            });

            const response: ApiResponse<string[]> = {
                success: true,
                message: 'Model trained successfully',
                data: results
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to train model',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    router.post('/predict', async (req: Request, res: Response) => {
        try {
            const { opponent, venue, competition }: { opponent?: string; venue?: string; competition?: string } = req.body;

            if (!opponent || !venue || !competition) {
                const response: ApiResponse = {
                    success: false,
                    error: 'Missing required fields: opponent, venue, competition'
                };
                return res.status(400).json(response);
            }

            const prediction = await mlService.predictMatch(opponent, venue, competition);
            
            await dbService.insertPrediction({
                matchDate: new Date().toISOString().split('T')[0],
                opponent,
                venue,
                competition,
                predictedResult: prediction.prediction,
                winProbability: prediction.probabilities.Win,
                drawProbability: prediction.probabilities.Draw,
                lossProbability: prediction.probabilities.Loss,
                confidence: prediction.confidence,
                modelVersion: prediction.model_version
            });

            broadcastToClients({
                type: 'new_prediction',
                data: prediction
            });

            const response: ApiResponse<MLPrediction> = {
                success: true,
                data: prediction
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to generate prediction',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    router.post('/update-data', async (req: Request, res: Response) => {
        try {
            const results = await mlService.updateData();
            
            broadcastToClients({
                type: 'data_updated',
                data: { timestamp: new Date() }
            });

            const response: ApiResponse<string[]> = {
                success: true,
                message: 'Data updated successfully',
                data: results
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to update data',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    return router;
};

