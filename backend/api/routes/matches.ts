import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { ApiResponse, Match } from '../types';

export const createMatchRoutes = (dbService: DatabaseService) => {
    const router = Router();

    router.get('/', async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const matches = await dbService.getMatches(limit);
            const response: ApiResponse<Match[]> = {
                success: true,
                data: matches,
                total: matches.length
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to fetch matches',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    router.get('/latest', async (req: Request, res: Response) => {
        try {
            const match = await dbService.getLatestMatch();
            const response: ApiResponse<Match | undefined> = {
                success: true,
                data: match
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to fetch latest match',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    router.get('/competition/:competition', async (req: Request, res: Response) => {
        try {
            const { competition } = req.params;
            const matches = await dbService.getMatchesByCompetition(competition);
            const response: ApiResponse<Match[]> = {
                success: true,
                data: matches,
                total: matches.length
            };
            res.json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                error: 'Failed to fetch matches by competition',
                details: error instanceof Error ? error.message : 'Unknown error'
            };
            res.status(500).json(response);
        }
    });

    return router;
};
