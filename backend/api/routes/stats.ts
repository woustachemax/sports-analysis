import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { ApiResponse, FormStats, SeasonStats } from '../types';

export const createStatsRoutes = (dbService: DatabaseService) => {
    const router = Router();

    router.get('/form', async (req: Request, res: Response) => {
        try {
            const matches = parseInt(req.query.matches as string) || 10;
            const stats = await dbService.getFormStats(matches);
            const response: ApiResponse<FormStats> = {
                success: true,
                data: stats
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to fetch form stats',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    router.get('/season', async (req: Request, res: Response) => {
        try {
            const stats = await dbService.getSeasonStats();
            const response: ApiResponse<SeasonStats> = {
                success: true,
                data: stats
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to fetch season stats',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    return router;
};
